export interface WorkerMessage<T = any> {
  type: string;
  payload?: T;
}
