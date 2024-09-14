import { Module } from '@nestjs/common';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';
import { MqttModule } from '../mqtt/mqtt.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MqttModule, ConfigModule],
  controllers: [TimerController],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimerModule {}
