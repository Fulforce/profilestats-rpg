import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  writeFilesTransaction,
  type TransactionalFileOperations
} from "../src/io/transactional-files.js";

describe("writeFilesTransaction", () => {
  it("restores every previous artifact after a mid-commit failure", async () => {
    const directory = await mkdtemp(join(tmpdir(), "profilestats-rpg-transaction-"));
    const firstPath = join(directory, "first.json");
    const secondPath = join(directory, "second.svg");
    await Promise.all([writeFile(firstPath, "old first"), writeFile(secondPath, "old second")]);

    const operations: TransactionalFileOperations = {
      access,
      mkdir,
      rm,
      writeFile,
      createId: () => "test-transaction",
      rename: async (oldPath, newPath) => {
        if (String(oldPath).endsWith("second.svg.test-transaction.tmp")) {
          throw new Error("simulated commit failure");
        }
        await rename(oldPath, newPath);
      }
    };

    await expect(
      writeFilesTransaction(
        [
          { path: firstPath, content: "new first" },
          { path: secondPath, content: "new second" }
        ],
        operations
      )
    ).rejects.toMatchObject({ code: "STORAGE_WRITE_FAILED" });

    await expect(readFile(firstPath, "utf8")).resolves.toBe("old first");
    await expect(readFile(secondPath, "utf8")).resolves.toBe("old second");
  });
});
