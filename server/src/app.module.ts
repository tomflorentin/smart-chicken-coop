import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MqttModule } from './mqtt/mqtt.module';
import { ConfigModule } from '@nestjs/config';
import { TimerModule } from './timer/timer.module';

@Module({
  imports: [ConfigModule.forRoot(), MqttModule, TimerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
