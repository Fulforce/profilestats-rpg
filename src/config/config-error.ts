import type { ConfigValidationIssue } from "./types.js";

export class ConfigValidationError extends Error {
  constructor(public readonly issues: ConfigValidationIssue[]) {
    super(
      `Invalid configuration:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join("\n")}`
    );
    this.name = "ConfigValidationError";
  }
}
