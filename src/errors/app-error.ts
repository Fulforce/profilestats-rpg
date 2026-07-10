export type AppErrorOptions = {
  cause?: unknown;
  retryable?: boolean;
};

export class AppError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;

  constructor(code: string, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.retryable = options.retryable ?? false;
  }
}
