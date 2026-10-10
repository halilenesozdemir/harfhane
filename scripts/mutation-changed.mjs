#!/usr/bin/env node
// Changed-files mutation gate (Plan 009 KTD4, R7, R10). Finds the files this
// branch changed (committed since it diverged from local origin/main, plus
// anything still uncommitted) under the paths Stryker is wired for, excludes
// test files, and runs Stryker's `--mutate` on exactly those files, ONE
// FILE PER STRYKER INVOCATION — so "Instrumented 1 source file(s) with 0
// mutant(s)" (or non-zero) unambiguously describes that one file, with no
// aggregate-count ambiguity across a batch. Exits non-zero when any changed
// file's mutation score is below MUTATION_BREAK_THRESHOLD, when Stryker
// itself fails, when its glob didn't find a requested file, when a file's
// mutants are all errors, or when a file disappears from the report without
// Stryker confirming it has zero mutants (a key-mismatch bug must never
// look like "nothing to score"). Exits 0 with a message when nothing
// relevant changed.
//
// This diffs against the LOCAL origin/main ref, not the remote: run
// `git fetch origin` first if your local origin/main may be stale.
//
// apps/backend/src/{services,repositories} is not in PROJECTS yet: Stryker's
// vitest-runner runs vitest through its own Node-API invocation, which does
// not go through the Cloudflare Workers Vitest pool, so any backend test
// touching a D1 binding or a Workers-only API (e.g. crypto.subtle's
// timingSafeEqual) fails in Stryker's dry run even though it passes under
// `pnpm --filter @harfhane/backend run test`. See docs/backlog.md.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

export const MUTATION_BREAK_THRESHOLD = 70;

const TEST_FILE_PATTERN = /\.test\.ts$|\.test-utils\.ts$/;

// Each project is a directory Stryker runs in (its own stryker.conf.json),
// with the repo-root-relative source prefix KTD4 scopes mutation to.
export const PROJECTS = [
  {
    name: "shared",
    cwd: "packages/shared",
    pathPrefix: "packages/shared/src/",
    configFile: "stryker.conf.json",
  },
];

function isTestFile(repoRelativePath) {
  return TEST_FILE_PATTERN.test(repoRelativePath);
}

function findProjectFor(repoRelativePath) {
  return PROJECTS.find((project) => repoRelativePath.startsWith(project.pathPrefix));
}

// Pure: groups changed repo-relative paths by project, dropping test files
// and anything outside a configured project's path prefix. Exported so the
// unit tests can exercise the selection logic on fixture file lists, without
// git or Stryker.
export function groupChangedFilesByProject(changedFiles) {
  const groups = new Map();
  for (const file of changedFiles) {
    if (isTestFile(file)) continue;
    const project = findProjectFor(file);
    if (!project) continue;
    const projectFiles = groups.get(project.name) ?? { project, files: [] };
    projectFiles.files.push(file);
    groups.set(project.name, projectFiles);
  }
  return [...groups.values()];
}

// Every GIT_* env var is stripped (not an allowlist) before any git
// subprocess call, so an ambient GIT_DIR/GIT_WORK_TREE/GIT_COMMON_DIR/
// GIT_CONFIG/GIT_INDEX_FILE (set by git itself while running a hook, or
// inherited from a parent git invocation) can never redirect a git call
// meant for one repo onto another. This bit a previous version of this
// script hard: see docs/backlog.md ("git env leak" entry).
export function stripGitEnv(env = process.env) {
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith("GIT_")) result[key] = value;
  }
  return result;
}

function gitEnv() {
  return stripGitEnv();
}

// Git quotes/escapes a non-ASCII path (e.g. containing "ü") in its output by
// default; `-c core.quotePath=false` turns that off so a Turkish filename
// round-trips as the literal UTF-8 text it is, not a quoted escape string.
const GIT_PATH_SAFE_ARGS = ["-c", "core.quotePath=false"];

// Throws (with git's own stderr) instead of swallowing a failure into "" —
// a bad base ref or any other git error must stop the gate, not silently
// report "nothing changed".
function runGit(args, cwd) {
  try {
    return execFileSync("git", [...GIT_PATH_SAFE_ARGS, ...args], { cwd, encoding: "utf8", env: gitEnv() }).trim();
  } catch (error) {
    const stderr = error.stderr ? error.stderr.toString().trim() : error.message;
    throw new Error(`git ${args.join(" ")} (in ${cwd}) failed: ${stderr}`);
  }
}

function splitNonEmptyLines(text) {
  return text.split("\n").filter((line) => line.length > 0);
}

// Committed-since-divergence changes plus whatever is still uncommitted
// (staged, unstaged or untracked), deduplicated. `--diff-filter=d` excludes
// deleted paths from both diffs: a file this branch deleted can't be
// mutated, and Stryker's glob would just warn that it found nothing.
export function getChangedFiles({ repoRoot, baseRef = "origin/main" }) {
  let committed;
  try {
    committed = runGit(["diff", "--name-only", "--diff-filter=d", `${baseRef}...HEAD`], repoRoot);
  } catch (error) {
    throw new Error(
      `Could not diff against base ref "${baseRef}" (it may not exist locally — try \`git fetch origin\`): ${error.message}`,
    );
  }
  const uncommitted = runGit(["diff", "--name-only", "--diff-filter=d", "HEAD"], repoRoot);
  const untracked = runGit(["ls-files", "--others", "--exclude-standard"], repoRoot);
  return [
    ...new Set([
      ...splitNonEmptyLines(committed),
      ...splitNonEmptyLines(uncommitted),
      ...splitNonEmptyLines(untracked),
    ]),
  ];
}

// Pure: a project-relative path, normalized so a lookup never misses just
// because of a backslash (Windows) or a leading "./".
export function normalizeProjectPath(path) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}

const COUNTABLE_STATUSES = ["Killed", "Survived", "Timeout", "NoCoverage"];
const ERROR_STATUSES = ["RuntimeError", "CompileError"];

// Pure: for each file Stryker's report lists, compute its mutation score —
// Killed/Timeout count as caught, Survived/NoCoverage as missed, Ignored
// excluded from the denominator (same as Stryker's own mutation score) — OR
// mark it in `errorOnlyFiles` when it has mutants but NONE are countable AND
// at least one is a RuntimeError/CompileError: that file was never actually
// verified (its mutants errored instead of running), which must fail, not
// silently pass as "nothing to score" the way an Ignored-only file does.
// Keys are normalized project-relative paths, matching normalizeProjectPath.
export function analyzeReport(report) {
  const scores = {};
  const errorOnlyFiles = new Set();
  for (const [filePath, file] of Object.entries(report.files ?? {})) {
    const key = normalizeProjectPath(filePath);
    const countable = file.mutants.filter((m) => COUNTABLE_STATUSES.includes(m.status));
    if (countable.length > 0) {
      const caught = countable.filter((m) => m.status === "Killed" || m.status === "Timeout").length;
      scores[key] = (caught / countable.length) * 100;
      continue;
    }
    if (file.mutants.some((m) => ERROR_STATUSES.includes(m.status))) {
      errorOnlyFiles.add(key);
    }
  }
  return { scores, errorOnlyFiles };
}

// Stryker prints this exact line (ProjectReader) once per `--mutate` glob
// entry that matched nothing on disk — our one reliable, Stryker-sourced
// signal that a *requested* file was never even looked at.
const UNMATCHED_GLOB_PATTERN = /Glob pattern "([^"]+)" did not result in any files\./g;

export function parseUnmatchedFiles(output) {
  return new Set([...output.matchAll(UNMATCHED_GLOB_PATTERN)].map((m) => normalizeProjectPath(m[1])));
}

// Each gate run mutates exactly one file per Stryker invocation (see the
// module comment), so this line's mutant count is unambiguously about that
// one file: it is the ONLY Stryker-sourced way to confirm "this file really
// has zero mutants" (a type-only or re-export file) as opposed to "this
// file's mutants just didn't make it into the report under the key we
// looked up" (a bug). Returns null if the line isn't found at all (an
// unexpected Stryker output shape — treated as "not confirmed").
const INSTRUMENTED_PATTERN = /Instrumented \d+ source file\(s\) with (\d+) mutant\(s\)/;

export function parseInstrumentedMutantCount(output) {
  const match = INSTRUMENTED_PATTERN.exec(output);
  return match ? Number(match[1]) : null;
}

// Pure decision for one file: given whether Stryker crashed (no fresh
// report at all), whether its glob failed to match this file, whether this
// file's mutants were all errors, the scores map, and the instrumented
// mutant count parsed from this run's own output, decide the outcome line
// and exit code. Exported and tested directly, with no git or Stryker
// involved, so a mutant in this logic (inverted threshold, wrong exit code,
// dropping NoCoverage/Timeout, a key mismatch silently passing as "no
// mutants") gets caught here instead of only in a slow end-to-end run.
export function decideFileResult({ file, crashed, unmatched, errorOnlyFiles, scores, instrumentedMutantCount }) {
  if (crashed) {
    return { line: `  ${file.display}: Stryker produced no report (crashed before finishing) — FAIL`, failed: true };
  }
  if (unmatched) {
    return { line: `  ${file.display}: Stryker's glob did not match this file — FAIL`, failed: true };
  }
  if (errorOnlyFiles.has(file.key)) {
    return {
      line: `  ${file.display}: every mutant errored (RuntimeError/CompileError), nothing was verified — FAIL`,
      failed: true,
    };
  }
  const score = scores[file.key];
  if (score === undefined) {
    if (instrumentedMutantCount === 0) {
      return { line: `  ${file.display}: no mutants (type-only or re-export file, ok)`, failed: false };
    }
    return {
      line: `  ${file.display}: missing from the report and Stryker did not confirm zero mutants — FAIL (key mismatch?)`,
      failed: true,
    };
  }
  const belowThreshold = score < MUTATION_BREAK_THRESHOLD;
  return {
    line: `  ${file.display}: ${score.toFixed(2)} (${belowThreshold ? "BELOW THRESHOLD" : "ok"})`,
    failed: belowThreshold,
  };
}

// Runs Stryker once for exactly one file. `spawn` is injectable so tests can
// simulate a crash (a leftover report plus a spawn that doesn't produce a
// new one) or a key-mismatch bug, without running real Stryker.
export function runStrykerForFile(repoRoot, project, record, { spawn = spawnSync } = {}) {
  const projectCwd = join(repoRoot, project.cwd);
  const reportDir = join(projectCwd, "reports", "mutation");

  // Never read a report left over from a previous run. If Stryker crashes
  // before writing a new one, there must be nothing here to fall back to —
  // the bug this was built to close.
  rmSync(reportDir, { recursive: true, force: true });

  const result = spawn("npx", ["stryker", "run", project.configFile, "--mutate", record.key], {
    cwd: projectCwd,
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const unmatched = parseUnmatchedFiles(combinedOutput).has(record.key);
  const instrumentedMutantCount = parseInstrumentedMutantCount(combinedOutput);

  const reportPath = join(reportDir, "mutation.json");
  const crashed = !existsSync(reportPath);
  const { scores, errorOnlyFiles } = crashed
    ? { scores: {}, errorOnlyFiles: new Set() }
    : analyzeReport(JSON.parse(readFileSync(reportPath, "utf8")));

  return decideFileResult({ file: record, crashed, unmatched, errorOnlyFiles, scores, instrumentedMutantCount });
}

function toRecord(repoRoot, projectCwd, file) {
  return { display: file, key: normalizeProjectPath(relative(projectCwd, join(repoRoot, file))) };
}

function main() {
  let repoRoot;
  try {
    repoRoot = runGit(["rev-parse", "--show-toplevel"], process.cwd());
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log("Diffing against the local origin/main ref (run `git fetch origin` first if it may be stale).");

  let changedFiles;
  try {
    changedFiles = getChangedFiles({ repoRoot });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const groups = groupChangedFilesByProject(changedFiles);
  if (groups.length === 0) {
    console.log("No changed files under a mutation-tested path; skipping mutation testing.");
    process.exit(0);
  }

  const results = [];
  for (const { project, files } of groups) {
    console.log(`Mutating ${files.length} file(s) in ${project.name} (one Stryker run per file): ${files.join(", ")}`);
    const projectCwd = join(repoRoot, project.cwd);
    for (const file of files) {
      const record = toRecord(repoRoot, projectCwd, file);
      const result = runStrykerForFile(repoRoot, project, record);
      console.log(result.line);
      results.push(result);
    }
  }

  const exitCode = exitCodeFor(results);

  if (exitCode !== 0) {
    console.error(`Mutation gate failed: a file scored below MUTATION_BREAK_THRESHOLD (${MUTATION_BREAK_THRESHOLD}), Stryker failed, or a requested file was not found.`);
  } else {
    console.log("All changed, mutation-tested files meet the break threshold.");
  }
  process.exit(exitCode);
}

/** Exit code for the gate: 1 when any per-file result failed, else 0. */
export function exitCodeFor(results) {
  return results.some((result) => result.failed) ? 1 : 0;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main();
}
