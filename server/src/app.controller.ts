import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import State from './state';
import { Tasks } from './tasks';

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
    return Tasks.sort((a, b) => +a.timeStarted - +b.timeStarted);
  }

  @Post('door/open')
  openDoor() {
    this.appService.openDoor();
  }

  @Post('door/safe-close')
  safeCloseDoor() {
    this.appService.safeCloseDoor();
  }

  @Post('door/force-close')
  forceCloseDoor() {
    this.appService.forceCloseDoor();
  }

  @Post('fence/enable')
  enableFence() {
    this.appService.enableFence();
  }

  @Post('fence/disable')
  disableFence() {
    this.appService.disableFence();
  }

  @Post('alert/enable')
  enableAlert() {
    this.appService.enableAlert();
  }

  @Post('alert/disable')
  disableAlert() {
    this.appService.disableAlert();
  }
}
