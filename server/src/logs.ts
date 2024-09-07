import { Topic } from './mqtt/mqtt.service';

export interface Log {
  date: Date;
  topic: Topic;
  message: string;
  direction: 'in' | 'out';
}

export const Logs: Log[] = [];

setInterval(() => {
  // Only keep 1000 logs, remove the oldest ones
  Logs.sort((a, b) => +a.date - +b.date).slice(0, 1000);
}, 1000 * 30);
