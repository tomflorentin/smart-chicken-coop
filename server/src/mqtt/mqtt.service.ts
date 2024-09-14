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
import { sleep } from '../utils';

export enum Topic {
  poulaillerPing = 'poulailler/ping',
  poulaillerPong = 'poulailler/pong',
  poulaillerBoot = 'poulailler/boot',
  poulaillerDoor = 'poulailler/door',
  poulaillerDoorOrder = 'poulailler/door/order',
  poulaillerDoorInfo = 'poulailler/door/info',
  enclosPing = 'enclos/ping',
  enclosPong = 'enclos/pong',
  enclosBoot = 'enclos/boot',
  enclosFence = 'enclos/fence',
  enclosFenceOrder = 'enclos/fence/order',
  enclosFenceInfo = 'enclos/fence/info',
  enclosAlert = 'enclos/alert',
  enclosAlertOrder = 'enclos/alert/order',
  enclosAlertInfo = 'enclos/alert/info',
}

@Injectable()
export class MqttService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  private mqttClient: MqttClient;

  // eslint-disable-next-line @typescript-eslint/ban-types
  private listeningTopics: { name: string; handler: Function }[] = [
    {
      name: Topic.poulaillerDoorInfo,
      handler: this.handlePoulaillerDoor.bind(this),
    },
    {
      name: Topic.enclosAlertInfo,
      handler: this.handleEnclosAlert.bind(this),
    },
    {
      name: Topic.enclosFenceInfo,
      handler: this.handleEnclosFence.bind(this),
    },
    {
      name: Topic.poulaillerPong,
      handler: () => {
        Logger.log('Poulailler pong received');
        State.poulailler.lastSeen = new Date();
      },
    },
    {
      name: Topic.enclosPong,
      handler: () => {
        Logger.log('Enclos pong received');
        State.enclos.lastSeen = new Date();
      },
    },
    {
      name: Topic.enclosBoot,
      handler: async () => {
        Logger.log('Enclos boot received');
        State.enclos.lastSeen = new Date();
        State.enclos.bootTime = new Date();
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
        this.publish(Topic.poulaillerDoorOrder, 'status');
        await Notify('🏠 Poulailler démarré');
      },
    },
  ];

  private async handlePoulaillerDoor(message: string) {
    const oldStatus = State.poulailler.door.status;
    console.log('door', message);
    State.poulailler.lastSeen = new Date();
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
    State.enclos.lastSeen = new Date();
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
      if (message.startsWith(AlertStatus.ENABLED)) {
        await Notify('🛡️ Détécteurs de mouvements activés');
      }
      if (message.startsWith(AlertStatus.DISABLED)) {
        await Notify('🛡️ Détécteurs de mouvements désactivés');
      }
    }
    if (State.enclos.alertSystem.status === AlertStatus.RESTORED) {
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
      concludeTasksWithTopic(Topic.enclosFence, message);
    }
    if (oldStatus !== State.enclos.electricFence.status) return;
    if (message.startsWith(FenceStatus.ENABLED)) {
      await Notify('⚡ Clôture électrique activée');
    }
    if (message.startsWith(FenceStatus.DISABLED)) {
      await Notify('⚡ Clôture électrique désactivée');
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
}
