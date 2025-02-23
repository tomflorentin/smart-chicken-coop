import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MqttService, Topic } from './mqtt/mqtt.service';
import State, { AlertOrder, DoorOrder, FenceOrder } from './state';
import { Task } from './tasks';
import { Notify } from './notify';
import { TaskService } from './task/task.service';

const secondsBeforePing = 30;
const secondsBeforeDisconnected = 120;

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly taskService: TaskService,
    private readonly mqttService: MqttService,
  ) {}

  async onModuleInit() {
    await Notify('🖥️ Système central démarré');
    return this.refreshState();
  }

  getHello(): string {
    return 'Hello World!';
  }

  async refreshState() {
    Logger.log('Refreshing state...');
    const nowMs = +new Date();

    // Pings
    if (
      !State.poulailler.lastSeen ||
      nowMs - +State.poulailler.lastSeen > secondsBeforePing * 1000
    ) {
      await this.mqttService.publish(Topic.poulaillerPing, 'ping');
    }
    if (
      !State.enclos.lastSeen ||
      nowMs - +State.enclos.lastSeen > secondsBeforePing * 1000
    ) {
      await this.mqttService.publish(Topic.enclosPing, 'ping');
    }
    if (
      State.enclos.lastSeen &&
      State.enclos.online &&
      nowMs - +State.enclos.lastSeen > secondsBeforeDisconnected * 1000
    ) {
      State.enclos.online = false;
      await Notify('💔 Enclos déconnecté');
    }
    if (
      State.poulailler.lastSeen &&
      State.poulailler.online &&
      nowMs - +State.poulailler.lastSeen > secondsBeforeDisconnected * 1000
    ) {
      State.poulailler.online = false;
      await Notify('💔 Poulailler déconnecté');
    }

    // Statuses
    if (!State.poulailler.door.status) {
      await this.mqttService.publish(
        Topic.poulaillerDoorOrder,
        DoorOrder.STATUS,
      );
    }
    if (!State.enclos.electricFence.status) {
      await this.mqttService.publish(Topic.enclosFenceOrder, FenceOrder.STATUS);
    }
    if (!State.enclos.alertSystem.status) {
      await this.mqttService.publish(Topic.enclosAlertOrder, AlertOrder.STATUS);
    }
  }

  disableAlert() {
    return this.taskService.executeTask(Topic.enclosAlert, AlertOrder.DISABLE);
  }

  enableAlert() {
    return this.taskService.executeTask(Topic.enclosAlert, AlertOrder.ENABLE);
  }

  disableFence() {
    return this.taskService.executeTask(Topic.enclosFence, FenceOrder.DISABLE);
  }

  enableFence() {
    return this.taskService.executeTask(Topic.enclosFence, FenceOrder.ENABLE);
  }

  forceCloseDoor() {
    this.taskService
      .executeTask(Topic.poulaillerDoor, DoorOrder.FORCE_CLOSE)
      .then()
      .catch(console.warn); // Do not wait for this long task
  }

  safeCloseDoor() {
    this.taskService
      .executeTask(Topic.poulaillerDoor, DoorOrder.SAFE_CLOSE)
      .then()
      .catch(console.warn); // Do not wait for this long task
  }

  openDoor() {
    this.taskService
      .executeTask(Topic.poulaillerDoor, DoorOrder.OPEN)
      .then()
      .catch(console.warn); // Do not wait for this long task
  }
}
