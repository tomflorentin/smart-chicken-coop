import { forwardRef, Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ConfigModule } from '@nestjs/config';
import { TimerModule } from '../timer/timer.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => TimerModule),
    forwardRef(() => TaskModule),
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
