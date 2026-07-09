import type { ThemeValidationIssue } from "./types.js";

export class ThemeValidationError extends Error {
  constructor(public readonly issues: ThemeValidationIssue[]) {
    super(
      `Invalid theme:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`
    );
    this.name = "ThemeValidationError";
  }
}
