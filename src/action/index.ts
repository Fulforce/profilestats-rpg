import { appendFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { isAbsolute, join, relative, resolve } from "node:path";
import { runUpdate } from "../update/update-runner.js";

const exec = promisify(execFile);

export async function runAction(): Promise<void> {
  const token = requiredInput("github-token");
  maskSecret(token);
  const configPath = input("config-path") || ".github/profile-stats-rpg.yml";
  const commitChanges = booleanInput("commit-changes", false);
  const allowAbandon = booleanInput("allow-abandon", false);
  const actionPath = process.env.GITHUB_ACTION_PATH;
  const workspace = process.env.GITHUB_WORKSPACE;
  if (!actionPath)
    throw new Error("GITHUB_ACTION_PATH is not available; run this as a GitHub Action.");
  if (!workspace)
    throw new Error("GITHUB_WORKSPACE is not available; checkout the consumer repository first.");
  assertRepositoryPath(configPath, workspace);
  process.chdir(workspace);

  const summary = await runUpdate({
    token,
    configPath,
    allowAbandon,
    themesRoot: join(actionPath, "themes")
  });
  const record = summary.snapshot.state.current;

  await setOutput("changed", String(summary.changedPaths.length > 0));
  await setOutput("svg-path", summary.config.output.svgPath);
  await setOutput("journey-status", record.progress.status);
  await setOutput("progress-percent", String(record.progress.progressPercent));

  if (commitChanges && summary.changedPaths.length > 0) {
    await commitGeneratedFiles(summary.artifactPaths);
  }
}

function assertRepositoryPath(path: string, workspace: string): void {
  const candidate = resolve(workspace, path);
  const fromWorkspace = relative(resolve(workspace), candidate);
  if (
    isAbsolute(path) ||
    fromWorkspace === ".." ||
    fromWorkspace.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  ) {
    throw new Error('Action input "config-path" must stay inside the checked-out repository.');
  }
}

async function commitGeneratedFiles(paths: string[]): Promise<void> {
  await git(["config", "user.name", "github-actions[bot]"]);
  await git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  await git(["add", "-f", "--", ...paths]);
  try {
    await git(["diff", "--cached", "--quiet", "--", ...paths]);
    return;
  } catch (error) {
    if (!isExitCode(error, 1)) throw error;
  }
  await git(["commit", "--only", "-m", "chore: update profile RPG journey", "--", ...paths]);
  await git(["push"]);
}

async function git(args: string[]): Promise<void> {
  await exec("git", args, { cwd: process.env.GITHUB_WORKSPACE ?? process.cwd() });
}

function input(name: string): string {
  return (process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "").trim();
}

function requiredInput(name: string): string {
  const value = input(name);
  if (!value) throw new Error(`Action input "${name}" is required.`);
  return value;
}

function booleanInput(name: string, defaultValue: boolean): boolean {
  const value = input(name);
  if (!value) return defaultValue;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Action input "${name}" must be true or false.`);
}

async function setOutput(name: string, value: string): Promise<void> {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) throw new Error("GITHUB_OUTPUT is not available; run this as a GitHub Action.");
  await appendFile(outputFile, `${name}=${value}\n`, "utf8");
}

function maskSecret(value: string): void {
  process.stdout.write(`::add-mask::${value}\n`);
}

function isExitCode(error: unknown, code: number): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

runAction().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "The profile RPG Action failed.";
  process.stderr.write(`::error::${message.replace(/\r?\n/g, "%0A")}\n`);
  process.exitCode = 1;
});
