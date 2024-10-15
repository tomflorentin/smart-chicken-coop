import { Controller, Get, Post } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TimerService } from './timer.service';

@Controller('timer')
export class TimerController {
  constructor(private readonly timerService: TimerService) {}
  @Cron(CronExpression.EVERY_DAY_AT_4PM)
  sendOpenAndCloseTimer() {
    return this.timerService.loadTimers(true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  checkTimers() {
    return this.timerService.checkTimers();
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  safetyCheck() {
    return this.timerService.safetyCheck();
  }

  @Post('')
  setTimetable() {
    return this.timerService.loadTimers();
  }

  @Get('')
  getTimetable() {
    return this.timerService.getTimers();
  }
}
