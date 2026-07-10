import type { ThemeValidationIssue } from "./types.js";
import { AppError } from "../errors/app-error.js";

export class ThemeValidationError extends AppError {
  constructor(public readonly issues: ThemeValidationIssue[]) {
    super(
      "THEME_INVALID",
      `Invalid theme:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`
    );
    this.name = "ThemeValidationError";
  }
}
