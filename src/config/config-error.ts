import type { ConfigValidationIssue } from "./types.js";
import { AppError } from "../errors/app-error.js";

export class ConfigValidationError extends AppError {
  constructor(public readonly issues: ConfigValidationIssue[]) {
    super(
      "CONFIG_INVALID",
      `Invalid configuration:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`
    );
    this.name = "ConfigValidationError";
  }
}
