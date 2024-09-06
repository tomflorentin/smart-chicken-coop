import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [MqttService, ConfigService],
  exports: [MqttService],
})
export class MqttModule {}
