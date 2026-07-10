import { AppError, type AppErrorOptions } from "../errors/app-error.js";

export class StorageError extends AppError {
  constructor(
    code: "STORAGE_INVALID" | "STORAGE_WRITE_FAILED",
    message: string,
    options: AppErrorOptions = {}
  ) {
    super(code, message, options);
    this.name = "StorageError";
  }
}
