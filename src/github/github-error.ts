import { AppError, type AppErrorOptions } from "../errors/app-error.js";
import type { ActivityMetric } from "../domain/types.js";

export type GitHubErrorCode =
  | "GITHUB_AUTHENTICATION_FAILED"
  | "GITHUB_USER_NOT_FOUND"
  | "GITHUB_RATE_LIMITED"
  | "GITHUB_NETWORK_FAILED"
  | "GITHUB_INVALID_RESPONSE"
  | "GITHUB_COLLECTION_FAILED";

type GitHubApiErrorOptions = AppErrorOptions & {
  metric?: ActivityMetric;
};

export class GitHubApiError extends AppError {
  public readonly metric?: ActivityMetric;

  constructor(code: GitHubErrorCode, message: string, options: GitHubApiErrorOptions = {}) {
    super(code, message, options);
    this.name = "GitHubApiError";
    this.metric = options.metric;
  }
}
