import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  MUTATION_BREAK_THRESHOLD,
  groupChangedFilesByProject,
  getChangedFiles,
  normalizeProjectPath,
  stripGitEnv,
  analyzeReport,
  parseUnmatchedFiles,
  parseInstrumentedMutantCount,
  decideFileResult,
  runStrykerForFile,
  exitCodeFor,
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

// --- analyzeReport ------------------------------------------------------

function fixtureReport({ survivedCount = 0, killedCount = 0, timeoutCount = 0, noCoverageCount = 0, runtimeErrorCount = 0, compileErrorCount = 0, ignoredCount = 0, path = "src/game/evaluate.ts" }) {
  const mutants = [];
  for (let i = 0; i < killedCount; i++) mutants.push({ id: `k${i}`, status: "Killed" });
  for (let i = 0; i < timeoutCount; i++) mutants.push({ id: `t${i}`, status: "Timeout" });
  for (let i = 0; i < survivedCount; i++) mutants.push({ id: `s${i}`, status: "Survived" });
  for (let i = 0; i < noCoverageCount; i++) mutants.push({ id: `n${i}`, status: "NoCoverage" });
  for (let i = 0; i < runtimeErrorCount; i++) mutants.push({ id: `r${i}`, status: "RuntimeError" });
  for (let i = 0; i < compileErrorCount; i++) mutants.push({ id: `c${i}`, status: "CompileError" });
  for (let i = 0; i < ignoredCount; i++) mutants.push({ id: `i${i}`, status: "Ignored" });
  return { files: { [path]: { mutants } } };
}

test("should report the file's score and flag it below MUTATION_BREAK_THRESHOLD when a duplicate-letter mutant survives (009-AE6)", () => {
  // 6 killed, 4 survived (one of them the duplicate-letter mutant) = 60%,
  // below the 70 break threshold.
  const { scores, errorOnlyFiles } = analyzeReport(fixtureReport({ killedCount: 6, survivedCount: 4 }));
  const result = decideFileResult({
    file: { display: "packages/shared/src/game/evaluate.ts", key: "src/game/evaluate.ts" },
    crashed: false,
    unmatched: false,
    errorOnlyFiles,
    scores,
    instrumentedMutantCount: 10,
  });

  assert.equal(result.failed, true);
  assert.ok(result.line.includes("60.00") && result.line.includes("BELOW THRESHOLD"));
});

test("should not flag a file at or above MUTATION_BREAK_THRESHOLD", () => {
  const { scores } = analyzeReport(fixtureReport({ killedCount: 7, survivedCount: 3 }));

  assert.equal(scores["src/game/evaluate.ts"], 70);
  assert.ok(scores["src/game/evaluate.ts"] >= MUTATION_BREAK_THRESHOLD);
});

test("should count a NoCoverage mutant as missed, same as Survived", () => {
  const { scores } = analyzeReport(fixtureReport({ killedCount: 1, noCoverageCount: 1 }));

  assert.equal(scores["src/game/evaluate.ts"], 50);
});

test("should count a Timeout mutant as caught, same as Killed", () => {
  const { scores } = analyzeReport(fixtureReport({ timeoutCount: 1, survivedCount: 1 }));

  assert.equal(scores["src/game/evaluate.ts"], 50);
});

test("should exclude Ignored and CompileError mutants from the score when at least one mutant is countable", () => {
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

  assert.equal(analyzeReport(report).scores["src/game/evaluate.ts"], 100);
});

test("should treat a file whose mutants are all Ignored as having no score (not an error)", () => {
  const { scores, errorOnlyFiles } = analyzeReport(fixtureReport({ ignoredCount: 3 }));

  assert.equal(scores["src/game/evaluate.ts"], undefined);
  assert.equal(errorOnlyFiles.has("src/game/evaluate.ts"), false);
});

test("should flag a file whose mutants are all RuntimeError as an error file, not a pass", () => {
  const { scores, errorOnlyFiles } = analyzeReport(fixtureReport({ runtimeErrorCount: 3 }));

  assert.equal(scores["src/game/evaluate.ts"], undefined);
  assert.equal(errorOnlyFiles.has("src/game/evaluate.ts"), true);
});

test("should flag a file whose mutants are all CompileError as an error file, not a pass", () => {
  const { errorOnlyFiles } = analyzeReport(fixtureReport({ compileErrorCount: 2 }));

  assert.equal(errorOnlyFiles.has("src/game/evaluate.ts"), true);
});

test("should normalize a report's file-path key", () => {
  const report = { files: { "./src/game/evaluate.ts": { mutants: [{ id: "0", status: "Killed" }] } } };

  assert.equal(analyzeReport(report).scores["src/game/evaluate.ts"], 100);
});

// --- parseUnmatchedFiles / parseInstrumentedMutantCount ----------------------

test("should extract an unmatched glob pattern from Stryker's own warning line", () => {
  const output = 'WARN ProjectReader Glob pattern "src/game/missing.ts" did not result in any files.\n';

  assert.deepEqual(parseUnmatchedFiles(output), new Set(["src/game/missing.ts"]));
});

test("should find no unmatched files when Stryker printed no such warning", () => {
  assert.deepEqual(parseUnmatchedFiles("Found 1 of 22 file(s) to be mutated."), new Set());
});

test("should parse the instrumented mutant count from Stryker's own log line", () => {
  assert.equal(parseInstrumentedMutantCount("Instrumented 1 source file(s) with 0 mutant(s)"), 0);
  assert.equal(parseInstrumentedMutantCount("Instrumented 1 source file(s) with 22 mutant(s)"), 22);
});

test("should return null when the instrumented line is absent", () => {
  assert.equal(parseInstrumentedMutantCount("nothing relevant here"), null);
});

// --- decideFileResult ----------------------------------------------------

function file(display, key = display) {
  return { display, key };
}

test("should fail when Stryker crashed, even if scores computed from a stale report look fine", () => {
  // The stale-report bug: a leftover mutation.json from a previous, passing
  // run must never be read as if it reflected this run.
  const result = decideFileResult({
    file: file("packages/shared/src/game/evaluate.ts", "src/game/evaluate.ts"),
    crashed: true,
    unmatched: false,
    errorOnlyFiles: new Set(),
    scores: { "src/game/evaluate.ts": 100 },
    instrumentedMutantCount: null,
  });

  assert.equal(result.failed, true);
});

test("should pass when every file scores at or above the threshold", () => {
  const result = decideFileResult({
    file: file("packages/shared/src/game/hint.ts", "src/game/hint.ts"),
    crashed: false,
    unmatched: false,
    errorOnlyFiles: new Set(),
    scores: { "src/game/hint.ts": MUTATION_BREAK_THRESHOLD },
    instrumentedMutantCount: 22,
  });

  assert.equal(result.failed, false);
});

test("should fail when a file's score is exactly one point under the threshold", () => {
  const result = decideFileResult({
    file: file("packages/shared/src/game/evaluate.ts", "src/game/evaluate.ts"),
    crashed: false,
    unmatched: false,
    errorOnlyFiles: new Set(),
    scores: { "src/game/evaluate.ts": MUTATION_BREAK_THRESHOLD - 1 },
    instrumentedMutantCount: 10,
  });

  assert.equal(result.failed, true);
});

test("should fail when Stryker flagged the file as an unmatched glob", () => {
  const result = decideFileResult({
    file: file("packages/shared/src/game/missing.ts", "src/game/missing.ts"),
    crashed: false,
    unmatched: true,
    errorOnlyFiles: new Set(),
    scores: {},
    instrumentedMutantCount: null,
  });

  assert.equal(result.failed, true);
  assert.ok(result.line.includes("FAIL"));
});

test("should pass when a file is absent from scores AND Stryker's own instrumentation count confirms zero mutants", () => {
  const result = decideFileResult({
    file: file("packages/shared/src/game/types.ts", "src/game/types.ts"),
    crashed: false,
    unmatched: false,
    errorOnlyFiles: new Set(),
    scores: {},
    instrumentedMutantCount: 0,
  });

  assert.equal(result.failed, false);
  assert.ok(result.line.includes("no mutants"));
});

test("should FAIL (not pass as 'no mutants') when a file is absent from scores and the instrumented count is NOT confirmed zero — the key-mismatch case", () => {
  // This models toRecord computing a key that doesn't match what the report
  // uses: the file genuinely has mutants (instrumentedMutantCount > 0,
  // Stryker's own authoritative count for this single-file run) but
  // `scores` has no entry for our key. Silently treating this as "no
  // mutants" would be exactly the false-pass bug found in review.
  const result = decideFileResult({
    file: file("packages/shared/src/game/evaluate.ts", "src/GAME/Evaluate.ts"), // deliberately mismatched key
    crashed: false,
    unmatched: false,
    errorOnlyFiles: new Set(),
    scores: { "src/game/evaluate.ts": 100 }, // real score exists, but under a different key
    instrumentedMutantCount: 22,
  });

  assert.equal(result.failed, true);
  assert.ok(result.line.toLowerCase().includes("key mismatch"));
});

test("should FAIL (not pass) when a file is absent from scores and the instrumented count could not be parsed at all", () => {
  const result = decideFileResult({
    file: file("packages/shared/src/game/evaluate.ts", "src/game/evaluate.ts"),
    crashed: false,
    unmatched: false,
    errorOnlyFiles: new Set(),
    scores: {},
    instrumentedMutantCount: null,
  });

  assert.equal(result.failed, true);
});

test("should fail when every mutant for a file errored (RuntimeError/CompileError), not pass it as having nothing to score", () => {
  const result = decideFileResult({
    file: file("packages/shared/src/game/evaluate.ts", "src/game/evaluate.ts"),
    crashed: false,
    unmatched: false,
    errorOnlyFiles: new Set(["src/game/evaluate.ts"]),
    scores: {},
    instrumentedMutantCount: 5,
  });

  assert.equal(result.failed, true);
  assert.ok(result.line.includes("errored"));
});

// --- runStrykerForFile (spawn injected) -------------------------------------

function makeProjectFixture() {
  const repoRoot = mkdtempSync(join(tmpdir(), "mutation-changed-project-"));
  const projectCwd = join(repoRoot, "pkg");
  mkdirSync(join(projectCwd, "reports", "mutation"), { recursive: true });
  return { repoRoot, project: { name: "pkg", cwd: "pkg", configFile: "stryker.conf.json" } };
}

test("should fail when a leftover report exists and the injected spawn crashes without producing a new one", () => {
  const { repoRoot, project } = makeProjectFixture();
  try {
    const reportPath = join(repoRoot, project.cwd, "reports", "mutation", "mutation.json");
    // A stale, misleadingly-good report left over from a previous run.
    writeFileSync(reportPath, JSON.stringify({ files: { "src/evaluate.ts": { mutants: [{ id: "0", status: "Killed" }] } } }));

    const crashingSpawn = () => ({ status: 1, stdout: "", stderr: "ConfigError: There were failed tests in the initial test run." });

    const result = runStrykerForFile(repoRoot, project, { display: "src/evaluate.ts", key: "src/evaluate.ts" }, { spawn: crashingSpawn });

    assert.equal(result.failed, true);
    assert.ok(result.line.includes("crashed"));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should delete a leftover report before invoking spawn, so a crashing run never reads it", () => {
  const { repoRoot, project } = makeProjectFixture();
  try {
    const reportPath = join(repoRoot, project.cwd, "reports", "mutation", "mutation.json");
    writeFileSync(reportPath, JSON.stringify({ files: { "src/evaluate.ts": { mutants: [{ id: "0", status: "Killed" }] } } }));

    let reportPresentWhenSpawnRan = null;
    const spawn = () => {
      reportPresentWhenSpawnRan = existsSync(reportPath);
      return { status: 1, stdout: "", stderr: "crash" };
    };

    runStrykerForFile(repoRoot, project, { display: "src/evaluate.ts", key: "src/evaluate.ts" }, { spawn });

    assert.equal(reportPresentWhenSpawnRan, false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should pass when the injected spawn confirms zero mutants for a real run", () => {
  const { repoRoot, project } = makeProjectFixture();
  try {
    const zeroMutantSpawn = () => ({
      status: 0,
      stdout: "Found 1 of 5 file(s) to be mutated.\nInstrumented 1 source file(s) with 0 mutant(s).\n",
      stderr: "",
    });
    // Stryker writes nothing to report.files for a zero-mutant file (see
    // docs/backlog.md) — no report at all means crashed=true unless the
    // caller writes an (empty) one, which real Stryker does on a clean
    // exit. Simulate that.
    const reportDir = join(repoRoot, project.cwd, "reports", "mutation");
    const reportPath = join(reportDir, "mutation.json");
    const spawnThatWritesEmptyReport = (...args) => {
      mkdirSync(reportDir, { recursive: true });
      writeFileSync(reportPath, JSON.stringify({ files: {} }));
      return zeroMutantSpawn(...args);
    };

    const result = runStrykerForFile(
      repoRoot,
      project,
      { display: "src/types.ts", key: "src/types.ts" },
      { spawn: spawnThatWritesEmptyReport },
    );

    assert.equal(result.failed, false);
    assert.ok(result.line.includes("no mutants"));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("should FAIL when the injected spawn writes a report under a different key than requested (key-mismatch simulation)", () => {
  const { repoRoot, project } = makeProjectFixture();
  try {
    const reportDir = join(repoRoot, project.cwd, "reports", "mutation");
    const reportPath = join(reportDir, "mutation.json");
    const spawn = () => {
      // Stryker genuinely mutated the file (22 mutants) but under a key
      // spelling our lookup doesn't match.
      mkdirSync(reportDir, { recursive: true });
      writeFileSync(
        reportPath,
        JSON.stringify({ files: { "SRC/EVALUATE.TS": { mutants: [{ id: "0", status: "Killed" }] } } }),
      );
      return {
        status: 0,
        stdout: "Found 1 of 5 file(s) to be mutated.\nInstrumented 1 source file(s) with 22 mutant(s).\n",
        stderr: "",
      };
    };

    const result = runStrykerForFile(
      repoRoot,
      project,
      { display: "src/evaluate.ts", key: "src/evaluate.ts" },
      { spawn },
    );

    assert.equal(result.failed, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
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

test("should exit non-zero when any changed file fails the gate (009-AE6)", () => {
  assert.equal(exitCodeFor([{ failed: false }, { failed: true }]), 1);
});

test("should exit zero when every changed file passes the gate", () => {
  assert.equal(exitCodeFor([{ failed: false }, { failed: false }]), 0);
  assert.equal(exitCodeFor([]), 0);
});
