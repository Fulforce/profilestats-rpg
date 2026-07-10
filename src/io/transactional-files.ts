import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { StorageError } from "../storage/storage-error.js";

export type FileArtifact = {
  path: string;
  content: string;
};

export type TransactionalFileOperations = {
  access: typeof access;
  mkdir: typeof mkdir;
  rename: typeof rename;
  rm: typeof rm;
  writeFile: typeof writeFile;
  createId: () => string;
};

const defaultOperations: TransactionalFileOperations = {
  access,
  mkdir,
  rename,
  rm,
  writeFile,
  createId: randomUUID
};

type StagedArtifact = FileArtifact & {
  targetPath: string;
  temporaryPath: string;
  backupPath: string;
  hadOriginal: boolean;
  committed: boolean;
};

export async function writeFilesTransaction(
  artifacts: FileArtifact[],
  operations: TransactionalFileOperations = defaultOperations
): Promise<void> {
  const transactionId = operations.createId();
  const seenTargets = new Set<string>();
  const staged: StagedArtifact[] = artifacts.map((artifact) => {
    const targetPath = resolve(artifact.path);

    if (seenTargets.has(targetPath)) {
      throw new StorageError("STORAGE_INVALID", `Duplicate artifact path: ${artifact.path}`);
    }
    seenTargets.add(targetPath);

    return {
      ...artifact,
      targetPath,
      temporaryPath: `${targetPath}.${transactionId}.tmp`,
      backupPath: `${targetPath}.${transactionId}.bak`,
      hadOriginal: false,
      committed: false
    };
  });

  let succeeded = false;

  try {
    await Promise.all(
      staged.map(async (artifact) => {
        await operations.mkdir(dirname(artifact.targetPath), { recursive: true });
        await operations.writeFile(artifact.temporaryPath, artifact.content, {
          encoding: "utf8",
          flag: "wx"
        });
      })
    );

    for (const artifact of staged) {
      artifact.hadOriginal = await pathExists(artifact.targetPath, operations);
      if (artifact.hadOriginal) {
        await operations.rename(artifact.targetPath, artifact.backupPath);
      }
      await operations.rename(artifact.temporaryPath, artifact.targetPath);
      artifact.committed = true;
    }

    succeeded = true;
    await Promise.all(
      staged.map((artifact) =>
        operations.rm(artifact.backupPath, { force: true }).catch(() => undefined)
      )
    );
  } catch (error) {
    await rollback(staged, operations);
    throw new StorageError(
      "STORAGE_WRITE_FAILED",
      "Generated artifacts could not be written; previous files were preserved.",
      { cause: error }
    );
  } finally {
    await Promise.all(
      staged.map((artifact) =>
        operations.rm(artifact.temporaryPath, { force: true }).catch(() => undefined)
      )
    );
    if (succeeded) {
      await Promise.all(
        staged.map((artifact) =>
          operations.rm(artifact.backupPath, { force: true }).catch(() => undefined)
        )
      );
    }
  }
}

async function rollback(
  staged: StagedArtifact[],
  operations: TransactionalFileOperations
): Promise<void> {
  for (const artifact of [...staged].reverse()) {
    if (artifact.committed) {
      await operations.rm(artifact.targetPath, { force: true }).catch(() => undefined);
    }

    if (artifact.hadOriginal && (await pathExists(artifact.backupPath, operations))) {
      await operations.rename(artifact.backupPath, artifact.targetPath).catch(() => undefined);
    }
  }
}

async function pathExists(path: string, operations: TransactionalFileOperations): Promise<boolean> {
  try {
    await operations.access(path);
    return true;
  } catch {
    return false;
  }
}
