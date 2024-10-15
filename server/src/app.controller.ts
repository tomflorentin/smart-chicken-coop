import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import State from './state';
import { Tasks } from './tasks';
import { Logs } from './logs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async maintainState() {
    await this.appService.refreshState();
  }

  @Get('state')
  getState() {
    return State;
  }

  @Get('tasks')
  getTasks() {
    return Tasks.sort((a, b) => +b.timeStarted - +a.timeStarted);
  }

  @Get('logs')
  getLogs() {
    return Logs.sort((a, b) => +b.date - +a.date).slice(0, 100);
  }

  @Post('door/open')
  openDoor() {
    return this.appService.openDoor();
  }

  @Post('door/safe-close')
  safeCloseDoor() {
    return this.appService.safeCloseDoor();
  }

  @Post('door/force-close')
  forceCloseDoor() {
    return this.appService.forceCloseDoor();
  }

  @Post('fence/enable')
  enableFence() {
    return this.appService.enableFence();
  }

  @Post('fence/disable')
  disableFence() {
    return this.appService.disableFence();
  }

  @Post('alert/enable')
  enableAlert() {
    return this.appService.enableAlert();
  }

  @Post('alert/disable')
  disableAlert() {
    return this.appService.disableAlert();
  }
}
