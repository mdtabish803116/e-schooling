export interface WorkerJobContext<T = Record<string, any>> {
  id: string;
  name: string;
  queueName: string;
  data: T;
  attemptsMade: number;
  maxAttempts: number;
  updateProgress: (percentage: number) => Promise<void>;
}
