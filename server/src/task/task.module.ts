import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { ConfigModule } from '@nestjs/config';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  providers: [TaskService],
  imports: [ConfigModule, forwardRef(() => MqttModule)],
  exports: [TaskService],
})
export class TaskModule {}
