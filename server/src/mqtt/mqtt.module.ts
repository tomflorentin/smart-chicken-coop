import { Global, Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ConfigModule } from '@nestjs/config';
import { TimerModule } from '../timer/timer.module';

@Global()
@Module({
  imports: [ConfigModule, TimerModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
