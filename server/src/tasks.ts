export interface TaskPromise {
  resolve: (response: string) => void;
  reject: (error: Error) => void;
}

export class Task {
  intermediateStatus: string[] = [];
  status: string;
  timeStarted: Date;
  timeEnded: Date;

  public constructor(
    public readonly topic: string,
    public readonly order: string,
    private readonly promise: TaskPromise | null,
  ) {
    this.timeStarted = new Date();
    setTimeout(() => {
      if (!this.timeEnded && this.promise?.reject) {
        this.promise.reject(new Error('ordre sans réponse'));
      }
    }, 15 * 1000); // 15s
  }

  public conclude(status: string) {
    this.status = status;
    this.timeEnded = new Date();
    if (this.promise?.resolve) {
      this.promise.resolve(status);
    }
  }

  public addIntermediateStatus(status: string) {
    this.intermediateStatus.push(status);
  }
}
