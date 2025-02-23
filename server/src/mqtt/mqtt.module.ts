import { forwardRef, Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ConfigModule } from '@nestjs/config';
import { TimerModule } from '../timer/timer.module';

@Module({
  imports: [ConfigModule, forwardRef(() => TimerModule)],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
