export class Task {
  topic: string;
  order: string;
  intermediateStatus: string[] = [];
  status: string;
  timeStarted: Date;
  timeEnded: Date;

  public constructor(topic: string, order: string) {
    this.topic = topic;
    this.order = order;
    this.timeStarted = new Date();
  }

  public conclude(status: string) {
    this.status = status;
    this.timeEnded = new Date();
  }

  public addIntermediateStatus(status: string) {
    this.intermediateStatus.push(status);
  }
}

export let Tasks: Task[] = [];

export const findTaskWithTopic = (topic: string) =>
  Tasks.filter((t) => t.topic === topic && !t.timeEnded);

export const concludeTasksWithTopic = (topic: string, status: string) => {
  const tasks = findTaskWithTopic(topic);
  tasks.forEach((t) => t.conclude(status));
};

export const addIntermediateStatusToTasksWithTopic = (
  topic: string,
  status: string,
) => {
  const tasks = findTaskWithTopic(topic);
  tasks.forEach((t) => t.addIntermediateStatus(status));
};

setInterval(() => {
  // Only keep 100 tasks, remove the oldest ones
  Tasks = Tasks.sort((a, b) => +b.timeStarted - +a.timeStarted).slice(0, 100);
}, 1000 * 300);
