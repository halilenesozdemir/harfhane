import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  groupChangedFilesByProject,
  getChangedFiles,
  normalizeProjectPath,
  stripGitEnv,
} from "./mutation-changed.mjs";

// --- groupChangedFilesByProject -------------------------------------------

test("should keep a packages/shared source file when it is changed and not a test", () => {
  const groups = groupChangedFilesByProject(["packages/shared/src/game/evaluate.ts"]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].project.name, "shared");
  assert.deepEqual(groups[0].files, ["packages/shared/src/game/evaluate.ts"]);
});

test("should drop a packages/shared test file from the mutation set", () => {
  const groups = groupChangedFilesByProject([
    "packages/shared/src/game/evaluate.ts",
    "packages/shared/src/game/evaluate.test.ts",
    "packages/shared/src/game/evaluate.property.test.ts",
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].files, ["packages/shared/src/game/evaluate.ts"]);
});

test("should drop a test-utils helper file from the mutation set", () => {
  const groups = groupChangedFilesByProject([
    "packages/shared/src/game/turkish-arbitraries.test-utils.ts",
  ]);

  assert.deepEqual(groups, []);
});

test("should ignore a file outside any mutation-tested path", () => {
  const groups = groupChangedFilesByProject([
    "apps/frontend/src/App.tsx",
    "apps/backend/src/services/word-service.ts",
    "docs/backlog.md",
  ]);

  assert.deepEqual(groups, []);
});

test("should return no groups when nothing changed", () => {
  assert.deepEqual(groupChangedFilesByProject([]), []);
});

// --- stripGitEnv -------------------------------------------------------------

test("should drop every GIT_-prefixed env var, not just a fixed list", () => {
  const dirty = {
    PATH: "/usr/bin",
    GIT_DIR: "/somewhere/.git",
    GIT_WORK_TREE: "/somewhere",
    GIT_COMMON_DIR: "/somewhere/.git",
    GIT_CONFIG: "/somewhere/.git/config",
    GIT_INDEX_FILE: "/somewhere/.git/index",
    GIT_ANYTHING_FUTURE_FLAG: "x",
  };

  const clean = stripGitEnv(dirty);

  assert.deepEqual(clean, { PATH: "/usr/bin" });
});

// --- normalizeProjectPath --------------------------------------------------

test("should convert backslashes to forward slashes", () => {
  assert.equal(normalizeProjectPath("src\\game\\evaluate.ts"), "src/game/evaluate.ts");
});

test("should strip a leading './'", () => {
  assert.equal(normalizeProjectPath("./src/game/evaluate.ts"), "src/game/evaluate.ts");
});

test("should leave an already-normalized path unchanged", () => {
  assert.equal(normalizeProjectPath("src/game/evaluate.ts"), "src/game/evaluate.ts");
});

// --- getChangedFiles (integration: a real throwaway git repo) ---------------
//
// GIT_* env vars are stripped for every one of these git calls (both inside
// mutation-changed.mjs and here), GIT_CONFIG_NOSYSTEM/GIT_CONFIG_GLOBAL
// point this fixture repo's git commands away from any system/global
// config, GIT_CEILING_DIRECTORIES stops git from walking up past the shared
// tmp parent, and identity is supplied only via GIT_AUTHOR_*/GIT_COMMITTER_*
// env vars — `git config user.*` is never run, so nothing is ever written
// to any config file, the fixture's own included. This isolation was
// proven against a standalone "victim" repo (not a worktree of this repo)
// with GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE/GIT_COMMON_DIR/GIT_CONFIG all
// pointed at it; see the PR body for the before/after evidence.

const FIXTURE_TMP_PARENT = tmpdir();

function fixtureGitEnv() {
  return {
    ...stripGitEnv(),
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CEILING_DIRECTORIES: FIXTURE_TMP_PARENT,
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
}

function runGitCmd(args, cwd) {
  execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd, stdio: "pipe", env: fixtureGitEnv() });
}

function makeGitFixture() {
  const repoRoot = mkdtempSync(join(FIXTURE_TMP_PARENT, "mutation-changed-git-"));
  try {
    runGitCmd(["init", "-q", "-b", "main"], repoRoot);

    mkdirSync(join(repoRoot, "packages", "shared", "src", "game"), { recursive: true });
    const trackedPath = join(repoRoot, "packages", "shared", "src", "game", "evaluate.ts");
    const toDeletePath = join(repoRoot, "packages", "shared", "src", "game", "doomed.ts");
    writeFileSync(trackedPath, "export const x = 1;\n");
    writeFileSync(toDeletePath, "export const y = 1;\n");
    runGitCmd(["add", "."], repoRoot);
    runGitCmd(["commit", "-q", "-m", "initial"], repoRoot);

    // Simulate a local origin/main ref without a real remote: a plain ref
    // update is all `git diff <ref>...HEAD` needs.
    const headSha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: fixtureGitEnv(),
    }).trim();
    runGitCmd(["update-ref", "refs/remotes/origin/main", headSha], repoRoot);

    return { repoRoot, trackedPath, toDeletePath };
  } catch (error) {
    rmSync(repoRoot, { recursive: true, force: true });
    throw error;
  }
}

test("should include a file committed since origin/main diverged", () => {
  const { repoRoot, trackedPath } = makeGitFixture();
  try {
    writeFileSync(trackedPath, "export const x = 2;\n");
    runGitCmd(["add", "."], repoRoot);
    runGitCmd(["commit", "-q", "-m", "change"], repoRoot);

    const files = getChangedFiles({ repoRoot });

    assert.ok(files.includes("packages/shared/src/game/evaluate.ts"));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should include an uncommitted (unstaged) change", () => {
  const { repoRoot, trackedPath } = makeGitFixture();
  try {
    writeFileSync(trackedPath, "export const x = 3;\n");

    const files = getChangedFiles({ repoRoot });

    assert.ok(files.includes("packages/shared/src/game/evaluate.ts"));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should include an untracked file", () => {
  const { repoRoot } = makeGitFixture();
  try {
    const untrackedPath = join(repoRoot, "packages", "shared", "src", "game", "new-file.ts");
    writeFileSync(untrackedPath, "export const z = 1;\n");

    const files = getChangedFiles({ repoRoot });

    assert.ok(files.includes("packages/shared/src/game/new-file.ts"));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should include an untracked file with a Turkish name, unquoted", () => {
  const { repoRoot } = makeGitFixture();
  try {
    const turkishPath = join(repoRoot, "packages", "shared", "src", "game", "günlük.ts");
    writeFileSync(turkishPath, "export const diary = 1;\n");

    const files = getChangedFiles({ repoRoot });

    assert.ok(
      files.includes("packages/shared/src/game/günlük.ts"),
      `expected an unquoted Turkish filename, got: ${JSON.stringify(files)}`,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should exclude a file deleted since origin/main diverged", () => {
  const { repoRoot, toDeletePath } = makeGitFixture();
  try {
    unlinkSync(toDeletePath);
    runGitCmd(["add", "."], repoRoot);
    runGitCmd(["commit", "-q", "-m", "delete"], repoRoot);

    const files = getChangedFiles({ repoRoot });

    assert.ok(!files.includes("packages/shared/src/game/doomed.ts"));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should exclude an uncommitted deletion", () => {
  const { repoRoot, toDeletePath } = makeGitFixture();
  try {
    unlinkSync(toDeletePath);

    const files = getChangedFiles({ repoRoot });

    assert.ok(!files.includes("packages/shared/src/game/doomed.ts"));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should throw a clear error when the base ref does not exist locally", () => {
  const { repoRoot } = makeGitFixture();
  try {
    assert.throws(
      () => getChangedFiles({ repoRoot, baseRef: "origin/does-not-exist" }),
      /origin\/does-not-exist/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should throw when repoRoot is not a git repository at all", () => {
  const nonRepoDir = mkdtempSync(join(FIXTURE_TMP_PARENT, "mutation-changed-nongit-"));
  try {
    assert.throws(() => getChangedFiles({ repoRoot: nonRepoDir }));
  } finally {
    rmSync(nonRepoDir, { recursive: true, force: true });
  }
});
