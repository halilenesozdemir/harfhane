import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  MUTATION_BREAK_THRESHOLD,
  groupChangedFilesByProject,
  getChangedFiles,
  computeFileScores,
  normalizeProjectPath,
  parseUnmatchedFiles,
  decideMutationResult,
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

// --- computeFileScores ------------------------------------------------------

function fixtureReport({ survivedCount = 0, killedCount = 0, timeoutCount = 0, noCoverageCount = 0 }) {
  const mutants = [];
  for (let i = 0; i < killedCount; i++) mutants.push({ id: `k${i}`, status: "Killed" });
  for (let i = 0; i < timeoutCount; i++) mutants.push({ id: `t${i}`, status: "Timeout" });
  for (let i = 0; i < survivedCount; i++) mutants.push({ id: `s${i}`, status: "Survived" });
  for (let i = 0; i < noCoverageCount; i++) mutants.push({ id: `n${i}`, status: "NoCoverage" });
  return { files: { "src/game/evaluate.ts": { mutants } } };
}

test("should report the file's score and flag it below MUTATION_BREAK_THRESHOLD when a duplicate-letter mutant survives (009-AE6)", () => {
  // 6 killed, 4 survived (one of them the duplicate-letter mutant) = 60%,
  // below the 70 break threshold.
  const report = fixtureReport({ killedCount: 6, survivedCount: 4 });
  const scores = computeFileScores(report);
  const result = decideMutationResult({
    files: [{ display: "packages/shared/src/game/evaluate.ts", key: "src/game/evaluate.ts" }],
    crashed: false,
    scores,
    unmatchedFiles: new Set(),
  });

  assert.equal(result.exitCode, 1);
  assert.ok(
    result.lines.some((line) => line.includes("60.00") && line.includes("BELOW THRESHOLD")),
    `expected a BELOW THRESHOLD line with 60.00, got: ${result.lines.join(" | ")}`,
  );
});

test("should not flag a file at or above MUTATION_BREAK_THRESHOLD", () => {
  const report = fixtureReport({ killedCount: 7, survivedCount: 3 });
  const scores = computeFileScores(report);

  assert.equal(scores["src/game/evaluate.ts"], 70);
  assert.ok(scores["src/game/evaluate.ts"] >= MUTATION_BREAK_THRESHOLD);
});

test("should count a NoCoverage mutant as missed, same as Survived", () => {
  const report = fixtureReport({ killedCount: 1, noCoverageCount: 1 });
  const scores = computeFileScores(report);

  assert.equal(scores["src/game/evaluate.ts"], 50);
});

test("should count a Timeout mutant as caught, same as Killed", () => {
  const report = fixtureReport({ timeoutCount: 1, survivedCount: 1 });
  const scores = computeFileScores(report);

  assert.equal(scores["src/game/evaluate.ts"], 50);
});

test("should exclude Ignored and CompileError mutants from the score", () => {
  const report = {
    files: {
      "src/game/evaluate.ts": {
        mutants: [
          { id: "0", status: "Killed" },
          { id: "1", status: "Ignored" },
          { id: "2", status: "CompileError" },
        ],
      },
    },
  };

  assert.equal(computeFileScores(report)["src/game/evaluate.ts"], 100);
});

test("should omit a file with no countable mutants from the scores", () => {
  const report = { files: { "src/game/evaluate.ts": { mutants: [{ id: "0", status: "Ignored" }] } } };

  assert.equal(computeFileScores(report)["src/game/evaluate.ts"], undefined);
});

test("should normalize a report's file-path key", () => {
  const report = { files: { "./src/game/evaluate.ts": { mutants: [{ id: "0", status: "Killed" }] } } };

  assert.equal(computeFileScores(report)["src/game/evaluate.ts"], 100);
});

// --- parseUnmatchedFiles -----------------------------------------------------

test("should extract an unmatched glob pattern from Stryker's own warning line", () => {
  const output = 'WARN ProjectReader Glob pattern "src/game/missing.ts" did not result in any files.\n';

  assert.deepEqual(parseUnmatchedFiles(output), new Set(["src/game/missing.ts"]));
});

test("should extract every unmatched pattern when Stryker warns about more than one", () => {
  const output = [
    'Glob pattern "src/a.ts" did not result in any files.',
    'Glob pattern "src/b.ts" did not result in any files.',
  ].join("\n");

  assert.deepEqual(parseUnmatchedFiles(output), new Set(["src/a.ts", "src/b.ts"]));
});

test("should find no unmatched files when Stryker printed no such warning", () => {
  assert.deepEqual(parseUnmatchedFiles("Found 1 of 22 file(s) to be mutated."), new Set());
});

// --- decideMutationResult ----------------------------------------------------

function record(display, key = display) {
  return { display, key };
}

test("should fail every requested file when Stryker crashed, even if scores computed from a stale report look fine", () => {
  // The stale-report bug: a leftover mutation.json from a previous, passing
  // run must never be read as if it reflected this run. `scores` here
  // stands in for exactly that stale, misleadingly-good data.
  const scores = { "src/game/evaluate.ts": 100 };

  const result = decideMutationResult({
    files: [record("packages/shared/src/game/evaluate.ts", "src/game/evaluate.ts")],
    crashed: true,
    scores,
    unmatchedFiles: new Set(),
  });

  assert.equal(result.exitCode, 1);
});

test("should judge each file on its own score when the run completed but the aggregate crossed the break threshold (not a crash)", () => {
  // Stryker's own process exit code is non-zero both when it crashes AND
  // when it completes normally but the aggregate score is simply below the
  // break threshold. `crashed: false` here models the second case (a real
  // report was written) — a passing batch-mate must not be dragged down
  // just because another file in the same run failed.
  const result = decideMutationResult({
    files: [
      record("packages/shared/src/game/types.ts", "src/game/types.ts"),
      record("packages/shared/src/game/keyboard.ts", "src/game/keyboard.ts"),
    ],
    crashed: false,
    scores: { "src/game/keyboard.ts": 0 },
    unmatchedFiles: new Set(),
  });

  assert.equal(result.exitCode, 1);
  assert.ok(result.lines.some((line) => line.includes("types.ts") && line.includes("no mutants")));
  assert.ok(result.lines.some((line) => line.includes("keyboard.ts") && line.includes("BELOW THRESHOLD")));
});

test("should pass when Stryker exits 0 and every file scores at or above the threshold", () => {
  const result = decideMutationResult({
    files: [record("packages/shared/src/game/hint.ts", "src/game/hint.ts")],
    crashed: false,
    scores: { "src/game/hint.ts": MUTATION_BREAK_THRESHOLD },
    unmatchedFiles: new Set(),
  });

  assert.equal(result.exitCode, 0);
});

test("should fail when a file's score is exactly one point under the threshold", () => {
  const result = decideMutationResult({
    files: [record("packages/shared/src/game/evaluate.ts", "src/game/evaluate.ts")],
    crashed: false,
    scores: { "src/game/evaluate.ts": MUTATION_BREAK_THRESHOLD - 1 },
    unmatchedFiles: new Set(),
  });

  assert.equal(result.exitCode, 1);
});

test("should fail when a changed file is missing from the report and Stryker flagged it as an unmatched glob", () => {
  const result = decideMutationResult({
    files: [record("packages/shared/src/game/missing.ts", "src/game/missing.ts")],
    crashed: false,
    scores: {},
    unmatchedFiles: new Set(["src/game/missing.ts"]),
  });

  assert.equal(result.exitCode, 1);
  assert.ok(result.lines.some((line) => line.includes("FAIL")));
});

test("should pass when a changed file is missing from the report but was not flagged as unmatched (a genuine zero-mutant file)", () => {
  const result = decideMutationResult({
    files: [record("packages/shared/src/game/types.ts", "src/game/types.ts")],
    crashed: false,
    scores: {},
    unmatchedFiles: new Set(),
  });

  assert.equal(result.exitCode, 0);
  assert.ok(result.lines.some((line) => line.includes("no mutants")));
});

test("should fail overall when one of several files is below threshold even if the others pass", () => {
  const result = decideMutationResult({
    files: [
      record("packages/shared/src/game/hint.ts", "src/game/hint.ts"),
      record("packages/shared/src/game/evaluate.ts", "src/game/evaluate.ts"),
    ],
    crashed: false,
    scores: { "src/game/hint.ts": 100, "src/game/evaluate.ts": 50 },
    unmatchedFiles: new Set(),
  });

  assert.equal(result.exitCode, 1);
});

// --- getChangedFiles (integration: a real throwaway git repo) ---------------

// Strip the same ambient GIT_DIR/GIT_WORK_TREE this file's pre-commit hook
// sets, so these throwaway fixture repos are not accidentally resolved
// against the real one (see mutation-changed.mjs's gitEnv()).
function fixtureGitEnv() {
  const env = { ...process.env };
  for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY"]) delete env[key];
  return env;
}

function runGitCmd(args, cwd) {
  execFileSync("git", args, { cwd, stdio: "pipe", env: fixtureGitEnv() });
}

function makeGitFixture() {
  const repoRoot = mkdtempSync(join(tmpdir(), "mutation-changed-git-"));
  runGitCmd(["init", "-q", "-b", "main"], repoRoot);
  runGitCmd(["config", "user.email", "test@example.com"], repoRoot);
  runGitCmd(["config", "user.name", "Test"], repoRoot);

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
  const nonRepoDir = mkdtempSync(join(tmpdir(), "mutation-changed-nongit-"));
  try {
    assert.throws(() => getChangedFiles({ repoRoot: nonRepoDir }));
  } finally {
    rmSync(nonRepoDir, { recursive: true, force: true });
  }
});
