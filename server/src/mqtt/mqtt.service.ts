import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import State, { AlertStatus, DoorStatus, FenceStatus } from '../state';
import {
  addIntermediateStatusToTasksWithTopic,
  concludeTasksWithTopic,
  Tasks,
} from '../tasks';
import { Logs } from '../logs';

export enum Topic {
  poulaillerPing = 'poulailler/ping',
  poulaillerDoor = 'poulailler/door',
  poulaillerDoorOrder = 'poulailler/door/order',
  poulaillerDoorInfo = 'poulailler/door/info',
  enclosPing = 'enclos/ping',
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
  ];

  private handlePoulaillerDoor(message: string) {
    console.log('door', message);
    State.poulailler.lastSeen = new Date();
    State.poulailler.door.status = message as DoorStatus;
    if (message === 'opened' || message === 'closed') {
      concludeTasksWithTopic(Topic.poulaillerDoor, message);
    } else {
      addIntermediateStatusToTasksWithTopic(Topic.poulaillerDoor, message);
    }
  }

  private handleEnclosAlert(message: string) {
    console.log('alert', message);
    State.enclos.lastSeen = new Date();
    State.enclos.alertSystem.status = message as AlertStatus;

    if (message === 'enabled' || message === 'disabled') {
      concludeTasksWithTopic(Topic.enclosAlert, message);
    }
  }

  private handleEnclosFence(message: string) {
    console.log('fence', message);
    State.enclos.lastSeen = new Date();
    State.enclos.electricFence.status = message as FenceStatus;

    if (message === 'enabled' || message === 'disabled') {
      concludeTasksWithTopic(Topic.enclosFence, message);
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

  publish(topic: Topic, payload: string): string {
    Logs.push({
      date: new Date(),
      topic,
      message: payload,
      direction: 'out',
    });
    Logger.log(`Publishing to ${topic} : ${payload}`);
    this.mqttClient.publish(topic, payload);
    return `Publishing to ${topic}`;
  }
}
