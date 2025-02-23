import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MqttService, Topic } from '../mqtt/mqtt.service';
import { Task } from '../tasks';

export let Tasks: Task[] = [];

@Injectable()
export class TaskService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(forwardRef(() => MqttService))
    private readonly mqttService: MqttService,
  ) {}

  private interval: string | number | NodeJS.Timeout;

  public onModuleInit(): any {
    this.interval = setInterval(() => {
      // Only keep 100 tasks, remove the oldest ones
      Tasks = Tasks.sort((a, b) => +b.timeStarted - +a.timeStarted).slice(
        0,
        100,
      );
    }, 1000 * 300);
  }

  public onModuleDestroy(): any {
    clearInterval(this.interval);
  }

  public findTaskWithTopic = (topic: string) =>
    Tasks.filter((t) => t.topic === topic && !t.timeEnded);

  public concludeTasksWithTopic = (topic: string, status: string) => {
    const tasks = this.findTaskWithTopic(topic);
    tasks.forEach((t) => t.conclude(status));
  };

  public addIntermediateStatusToTasksWithTopic = (
    topic: string,
    status: string,
  ) => {
    const tasks = this.findTaskWithTopic(topic);
    tasks.forEach((t) => t.addIntermediateStatus(status));
  };

  public async executeTask(topic: Topic, payload: string): Promise<string> {
    await this.mqttService.publish(topic, payload);
    return await new Promise<string>((resolve, reject) => {
      Tasks.push(new Task(topic, payload, { resolve, reject }));
    });
  }
}
