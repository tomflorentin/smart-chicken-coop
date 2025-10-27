import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import State, {
  AlertStatus,
  DoorStatus,
  FenceOrder,
  FenceStatus,
} from '../state';
import {
  addIntermediateStatusToTasksWithTopic,
  concludeTasksWithTopic,
} from '../tasks';
import { Logs } from '../logs';
import { Notify } from '../notify';
import { capitalizeFirstLetter, sleep } from '../utils';
import { TimerService } from '../timer/timer.service';
import { OnEvent } from '@nestjs/event-emitter';

export enum Topic {
  poulaillerPing = 'poulailler/ping',
  poulaillerPong = 'poulailler/pong',
  poulaillerWifi = 'poulailler/wifi',
  poulaillerBoot = 'poulailler/boot',
  poulaillerDoor = 'poulailler/door',
  poulaillerDoorOrder = 'poulailler/door/order',
  poulaillerDoorInfo = 'poulailler/door/info',
  poulaillerTemperature = 'poulailler/temperature',
  poulaillerHumidity = 'poulailler/humidity',
  enclosPing = 'enclos/ping',
  enclosPong = 'enclos/pong',
  enclosWifi = 'enclos/wifi',
  enclosBoot = 'enclos/boot',
  enclosFence = 'enclos/fence',
  enclosFenceOrder = 'enclos/fence/order',
  enclosFenceInfo = 'enclos/fence/info',
  enclosAlert = 'enclos/alert',
  enclosAlertOrder = 'enclos/alert/order',
  enclosAlertInfo = 'enclos/alert/info',
  wifiScan = '+/wifi-scan',
}

@Injectable()
export class MqttService implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    private readonly timerService: TimerService,
  ) {}

  private mqttClient: MqttClient;

  private listeningTopics: {
    name: string;
    handler: (m: string) => Promise<void> | void;
  }[] = [
    {
      name: Topic.poulaillerDoorInfo,
      handler: (m: string) => this.handlePoulaillerDoor(m),
    },
    {
      name: Topic.enclosAlertInfo,
      handler: (m: string) => this.handleEnclosAlert(m),
    },
    {
      name: Topic.enclosFenceInfo,
      handler: (m: string) => this.handleEnclosFence(m),
    },
    {
      name: Topic.poulaillerPong,
      handler: () => {
        Logger.log('Poulailler pong received');
        this.updateLastSeen('poulailler');
      },
    },
    {
      name: Topic.enclosPong,
      handler: () => {
        Logger.log('Enclos pong received');
        this.updateLastSeen('enclos');
      },
    },
    {
      name: Topic.wifiScan,
      handler: (value) => {
        Logger.log('Wifi scan received ' + value);
      },
    },
    {
      name: Topic.enclosBoot,
      handler: async () => {
        Logger.log('Enclos boot received');
        State.enclos.lastSeen = new Date();
        State.enclos.bootTime = new Date();
        State.enclos.online = true;
        this.publish(Topic.enclosFenceOrder, 'status');
        this.publish(Topic.enclosAlertOrder, 'status');
        await Notify('🧱 Enclos démarré');
      },
    },
    {
      name: Topic.poulaillerBoot,
      handler: async () => {
        Logger.log('Poulailler boot received');
        State.poulailler.lastSeen = new Date();
        State.poulailler.bootTime = new Date();
        State.poulailler.online = true;
        this.publish(Topic.poulaillerDoorOrder, 'status');
        await Notify('🏠 Poulailler démarré');
      },
    },
    {
      name: Topic.enclosWifi,
      handler: (value: 'normal' | 'backup') => {
        Logger.log('Enclos wifi received ' + value);
        if (value === 'backup' && State.enclos.wifi !== 'backup') {
          void Notify('📶 Enclos sur le wifi backup').catch(() => null);
        } else if (value === 'normal' && State.enclos.wifi !== 'normal') {
          void Notify('📶 Enclos revenu sur le wifi normal').catch(() => null);
        }
        State.enclos.wifi = value;
        this.updateLastSeen('enclos');
      },
    },
    {
      name: Topic.poulaillerWifi,
      handler: (value: 'normal' | 'backup') => {
        Logger.log('Poulailler wifi received ' + value);
        if (value === 'backup' && State.poulailler.wifi !== 'backup') {
          void Notify('📶 Poulailler sur le wifi backup').catch(() => null);
        } else if (value === 'normal' && State.poulailler.wifi !== 'normal') {
          void Notify('📶 Poulailler revenu sur le wifi normal').catch(
            () => null,
          );
        }
        State.poulailler.wifi = value;
        this.updateLastSeen('poulailler');
      },
    },
    {
      name: Topic.poulaillerTemperature,
      handler: (value: string) => {
        Logger.log('Poulailler temperature received ' + value);
        this.assignValueMinAndMax('temperature', value);
        this.updateLastSeen('poulailler');
      },
    },
    {
      name: Topic.poulaillerHumidity,
      handler: (value: string) => {
        Logger.log('Poulailler humidity received ' + value);
        this.assignValueMinAndMax('humidity', value);
        this.updateLastSeen('poulailler');
      },
    },
  ];

  private assignValueMinAndMax(property: string, valueStr: string) {
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      Logger.error('Invalid value received ' + valueStr);
      return;
    }
    State.poulailler[property] = value;
    if (State.poulailler[`min${capitalizeFirstLetter(property)}`] === null) {
      State.poulailler[`min${capitalizeFirstLetter(property)}`] = value;
    } else {
      State.poulailler[`min${capitalizeFirstLetter(property)}`] = Math.min(
        State.poulailler[`min${capitalizeFirstLetter(property)}`],
        value,
      );
    }
    State.poulailler[`max${capitalizeFirstLetter(property)}`] = Math.max(
      State.poulailler[`max${capitalizeFirstLetter(property)}`],
      value,
    );
  }

  private async handlePoulaillerDoor(message: string) {
    const oldStatus = State.poulailler.door.status;
    console.log('door', message);
    this.updateLastSeen('poulailler');
    if (message.startsWith('status-response')) {
      State.poulailler.door.status = message.split(' ')[1] as DoorStatus;
      return;
    }
    State.poulailler.door.status = message as DoorStatus;
    if (
      message.startsWith(DoorStatus.OPENED) ||
      message.startsWith(DoorStatus.OPENED)
    ) {
      concludeTasksWithTopic(Topic.poulaillerDoor, message);
    } else {
      addIntermediateStatusToTasksWithTopic(Topic.poulaillerDoor, message);
    }
    if (oldStatus === State.poulailler.door.status) return;
    if (message.startsWith(DoorStatus.BLOCKED)) {
      await Notify('❌ Porte bloquée !');
    }
    if (message.startsWith(DoorStatus.OPENED)) {
      await Notify('🚪 Porte ouverte');
    }
    if (message.startsWith(DoorStatus.CLOSED)) {
      await Notify('🚪 Porte fermée');
    }
    if (message.startsWith(DoorStatus.ABORTED)) {
      await Notify('🚪 Obstable détécté, abandon de la fermeture');
    }
  }

  private async handleEnclosAlert(message: string) {
    const oldStatus = State.enclos.alertSystem.status;
    console.log('alert', message);
    this.updateLastSeen('enclos');
    if (message.startsWith('status-response')) {
      State.enclos.alertSystem.status = message.split(' ')[1] as AlertStatus;
      return;
    }
    State.enclos.alertSystem.status = message as AlertStatus;

    if (
      message.startsWith(AlertStatus.ENABLED) ||
      message.startsWith(AlertStatus.ENABLED)
    ) {
      concludeTasksWithTopic(Topic.enclosAlert, message);
    }
    if (oldStatus !== State.enclos.alertSystem.status) {
      if (message.startsWith(AlertStatus.ALERT)) {
        State.enclos.alertSystem.detections.dates.push(new Date());
        State.enclos.alertSystem.detections.lastDetection = new Date();
      }
      if (message.startsWith(AlertStatus.ENABLED)) {
        await Notify('🛡️ Détécteurs de mouvements activés');
        State.enclos.alertSystem.detections = {
          dates: [],
          timeInAlert: 0,
          lastDetection: null,
        };
      }
      if (message.startsWith(AlertStatus.DISABLED)) {
        await Notify('🛡️ Détécteurs de mouvements désactivés');
      }
    }
    if (State.enclos.alertSystem.status === AlertStatus.RESTORED) {
      if (State.enclos.alertSystem.detections.lastDetection) {
        const timeInAlert =
          new Date().getTime() -
          State.enclos.alertSystem.detections.lastDetection.getTime();
        State.enclos.alertSystem.detections.timeInAlert += timeInAlert;
      }
      State.enclos.alertSystem.status = AlertStatus.ENABLED;
    }
  }

  private async handleEnclosFence(message: string) {
    const oldStatus = State.enclos.electricFence.status;
    console.log('fence', message);
    State.enclos.lastSeen = new Date();
    if (message.startsWith('status-response')) {
      State.enclos.electricFence.status = message.split(' ')[1] as FenceStatus;
      return;
    }
    State.enclos.electricFence.status = message as FenceStatus;

    if (
      message.startsWith(FenceStatus.ENABLED) ||
      message.startsWith(FenceStatus.DISABLED)
    ) {
      if (
        this.timerService.isAtNight() &&
        message.startsWith(FenceStatus.DISABLED)
      ) {
        setTimeout(async () => {
          await this.publish(Topic.enclosFenceOrder, FenceOrder.ENABLE);
          await Notify('⚡ Clôture électrique réactivée automatiquement');
        }, 900 * 1000);
      }
      concludeTasksWithTopic(Topic.enclosFence, message);
    }
    if (oldStatus === State.enclos.electricFence.status) return;
    if (message.startsWith(FenceStatus.ENABLED)) {
      await Notify('⚡ Clôture électrique activée');
    }
    if (message.startsWith(FenceStatus.DISABLED)) {
      await Notify(
        `⚡ Clôture électrique désactivée ${this.timerService.isAtNight() ? 'de nuit pour 15min' : ''}`,
      );
    }
  }

  async onModuleInit() {
    const host = this.configService.get<string>('MOSQUITTO_HOST');
    const port = this.configService.get<string>('MOSQUITTO_PORT');
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

    const connectUrl = `mqtt://${host}:${port}`;

    this.mqttClient = connect(connectUrl, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    this.mqttClient.on('connect', function () {
      Logger.log('Connected to CloudMQTT');
    });

    this.mqttClient.on('error', function () {
      Logger.error('Error in connecting to CloudMQTT');
    });

    this.mqttClient.on('reconnect', function () {
      Logger.error('Reconnecting to CloudMQTT');
    });

    this.mqttClient.on('message', (topic, message) => {
      const handler = this.listeningTopics.find(
        (t) => t.name === topic,
      )?.handler;
      if (!handler) {
        Logger.error('Unknown topic ' + topic);
        return;
      }
      const messageStr = message.toString();
      Logger.log(`Received message on ${topic}: ${messageStr}`);
      Logs.push({
        date: new Date(),
        topic: topic as Topic,
        message: messageStr,
        direction: 'in',
      });
      handler(messageStr);
    });

    await this.mqttClient.subscribeAsync(
      this.listeningTopics.map((t) => t.name),
    );
  }

  private lastMessageDate: Date = new Date();

  async publish(topic: Topic, payload: string): Promise<void> {
    if (!this.mqttClient?.publish) {
      await Notify('Erreur publish non définit');
      console.log(this);
      console.log(this.mqttClient);
      return;
    }
    Logs.push({
      date: new Date(),
      topic,
      message: payload,
      direction: 'out',
    });
    Logger.log(`Publishing to ${topic} : ${payload}`);
    while (new Date().getTime() - this.lastMessageDate.getTime() < 100) {
      await sleep(10);
    }
    this.lastMessageDate = new Date();
    this.mqttClient.publish(topic, payload);
  }

  private updateLastSeen(type: 'enclos' | 'poulailler') {
    const now = new Date();
    State[type].lastSeen = now;
    if (!State[type].online) {
      State[type].online = true;
      State[type].bootTime = now;
      void Notify(`${type === 'enclos' ? '🧱' : '🏠'} ${type} connecté`).catch(
        () => null,
      );
    }
  }

  @OnEvent('publish')
  async publishEvent(payload: { topic: Topic; message: string }) {
    await this.publish(payload.topic, payload.message).catch((ex) =>
      Notify('Erreur de publication ' + ex),
    );
  }
}
