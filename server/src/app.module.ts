import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TimerModule } from './timer/timer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MqttModule } from './mqtt/mqtt.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    MqttModule,
    TimerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
