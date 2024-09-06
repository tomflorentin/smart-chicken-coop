import { Injectable, OnModuleInit } from '@nestjs/common';
import { MqttService, Topic } from './mqtt/mqtt.service';
import State, { AlertOrder, DoorOrder, FenceOrder } from './state';
import { Task, Tasks } from './tasks';

const secondsBeforePing = 30;

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly mqttService: MqttService) {}

  onModuleInit() {
    return this.refreshState();
  }

  getHello(): string {
    return 'Hello World!';
  }

  async refreshState() {
    const nowMs = +new Date();

    // Pings
    if (
      State.poulailler.lastSeen &&
      nowMs - +State.poulailler.lastSeen > secondsBeforePing * 1000
    ) {
      this.mqttService.publish(Topic.poulaillerPing, 'ping');
    }
    if (
      State.enclos.lastSeen &&
      nowMs - +State.enclos.lastSeen > secondsBeforePing * 1000
    ) {
      this.mqttService.publish(Topic.enclosPing, 'ping');
    }

    // Statuses
    if (!State.poulailler.door.status) {
      this.mqttService.publish(Topic.poulaillerDoorOrder, DoorOrder.STATUS);
    }
    if (!State.enclos.electricFence.status) {
      this.mqttService.publish(Topic.enclosFenceOrder, FenceOrder.STATUS);
    }
    if (!State.enclos.alertSystem.status) {
      this.mqttService.publish(Topic.enclosAlertOrder, AlertOrder.STATUS);
    }
  }

  disableAlert() {
    Tasks.push(new Task(Topic.enclosAlert, AlertOrder.DISABLE));
    return this.mqttService.publish(Topic.enclosAlertOrder, AlertOrder.DISABLE);
  }

  enableAlert() {
    Tasks.push(new Task(Topic.enclosAlert, AlertOrder.ENABLE));
    return this.mqttService.publish(Topic.enclosAlertOrder, AlertOrder.ENABLE);
  }

  disableFence() {
    Tasks.push(new Task(Topic.enclosFence, FenceOrder.DISABLE));
    return this.mqttService.publish(Topic.enclosFenceOrder, FenceOrder.DISABLE);
  }

  enableFence() {
    Tasks.push(new Task(Topic.enclosFence, FenceOrder.ENABLE));
    return this.mqttService.publish(Topic.enclosFenceOrder, FenceOrder.ENABLE);
  }

  forceCloseDoor() {
    Tasks.push(new Task(Topic.poulaillerDoor, DoorOrder.FORCE_CLOSE));
    return this.mqttService.publish(
      Topic.poulaillerDoorOrder,
      DoorOrder.FORCE_CLOSE,
    );
  }

  safeCloseDoor() {
    Tasks.push(new Task(Topic.poulaillerDoor, DoorOrder.SAFE_CLOSE));
    return this.mqttService.publish(
      Topic.poulaillerDoorOrder,
      DoorOrder.SAFE_CLOSE,
    );
  }

  openDoor() {
    Tasks.push(new Task(Topic.poulaillerDoor, DoorOrder.OPEN));
    return this.mqttService.publish(Topic.poulaillerDoorOrder, DoorOrder.OPEN);
  }
}