import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Runs Vitest. Vite can't load project files from a folder whose path contains
 * "#" (it is read as a URL fragment), e.g. "F:\...\#2 Hastag & Caption Generator",
 * and it resolves symlinks/junctions back to the real path. So in that case we
 * copy the (small) sources and tests to a temp folder on every run, link
 * node_modules, and run Vitest there. Watch mode then won't see your edits:
 * re-run `npm test` instead. Everywhere else (CI, Vercel) Vitest runs directly.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let cwd = root;

if (root.includes("#")) {
  cwd = path.join(os.tmpdir(), "captioncraft-vitest");
  rmSync(cwd, { recursive: true, force: true });
  mkdirSync(cwd, { recursive: true });
  for (const entry of ["src", "tests", "vitest.config.mts", "tsconfig.json", "package.json"]) {
    cpSync(path.join(root, entry), path.join(cwd, entry), { recursive: true });
  }
  // "junction" needs no admin rights on Windows; ignored on other systems.
  symlinkSync(path.join(root, "node_modules"), path.join(cwd, "node_modules"), "junction");
}

const result = spawnSync(process.execPath, ["--preserve-symlinks", "--preserve-symlinks-main", path.join(cwd, "node_modules", "vitest", "vitest.mjs"), ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
  env: { ...process.env, ...(cwd !== root ? { VITEST_LINKED_NODE_MODULES: "1" } : {}) },
});
process.exit(result.status ?? 1);
