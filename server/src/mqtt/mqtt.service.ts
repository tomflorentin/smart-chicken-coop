import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import State, { AlertStatus, DoorOrder, DoorStatus, FenceOrder, FenceStatus } from '../state';
import {
  addIntermediateStatusToTasksWithTopic,
  concludeTasksWithTopic,
} from '../tasks';
import { Logs } from '../logs';
import { Notify } from '../notify';
import { sleep } from '../utils';
import { TimerService } from '../timer/timer.service';
import { OnEvent } from '@nestjs/event-emitter';

export enum Topic {
  door = 'enclos/door',
  doorOrder = 'enclos/door/order',
  doorInfo = 'enclos/door/info',
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
      name: Topic.doorInfo,
      handler: (m: string) => this.handleDoor(m),
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
      name: Topic.enclosPong,
      handler: () => {
        Logger.log('Enclos pong received');
        this.updateLastSeen();
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
        this.publish(Topic.doorOrder, DoorOrder.STATUS);
        await Notify('🧱 Enclos démarré');
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
        this.updateLastSeen();
      },
    },
  ];

  private async handleDoor(message: string) {
    const oldStatus = State.enclos.door.status;
    console.log('door', message);
    this.updateLastSeen();
    if (message.startsWith('status-response')) {
      State.enclos.door.status = message.split(' ')[1] as DoorStatus;
      return;
    }
    State.enclos.door.status = message as DoorStatus;
    if (
      message.startsWith(DoorStatus.OPENED) ||
      message.startsWith(DoorStatus.CLOSED)
    ) {
      concludeTasksWithTopic(Topic.door, message);
    } else {
      addIntermediateStatusToTasksWithTopic(Topic.door, message);
    }
    if (oldStatus === State.enclos.door.status) return;
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
    this.updateLastSeen();
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

  private updateLastSeen() {
    const now = new Date();
    State.enclos.lastSeen = now;
    if (!State.enclos.online) {
      State.enclos.online = true;
      State.enclos.bootTime = now;
      void Notify('🧱 Enclos connecté').catch(() => null);
    }
  }

  @OnEvent('publish')
  async publishEvent(payload: { topic: Topic; message: string }) {
    await this.publish(payload.topic, payload.message).catch((ex) =>
      Notify('Erreur de publication ' + ex),
    );
  }
}
