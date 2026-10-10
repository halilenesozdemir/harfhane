#!/usr/bin/env node
// Changed-files mutation gate (Plan 009 KTD4, R7, R10). Finds the files this
// branch changed (committed since it diverged from local origin/main, plus
// anything still uncommitted) under the paths Stryker is wired for, excludes
// test files, and runs Stryker's `--mutate` on exactly those files so a PR
// only pays for mutating what it touched. Exits non-zero when any changed
// file's mutation score is below MUTATION_BREAK_THRESHOLD, when Stryker
// itself fails or its glob didn't find a requested file, and exits 0 with a
// message when nothing relevant changed.
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

// GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE (set by git itself while running a
// hook, e.g. the commit-gate pre-commit hook this script's own tests run
// under) would make every git call below resolve against that ambient repo
// instead of the given `cwd`, no matter what `cwd` is — breaking both real
// use (always meant to mean "this `cwd`'s repo") and the tests that spin up
// a throwaway repo elsewhere to prove error handling.
const GIT_ENV_OVERRIDES = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY"];

function gitEnv() {
  const env = { ...process.env };
  for (const key of GIT_ENV_OVERRIDES) delete env[key];
  return env;
}

// Throws (with git's own stderr) instead of swallowing a failure into "" —
// a bad base ref or any other git error must stop the gate, not silently
// report "nothing changed".
function runGit(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", env: gitEnv() }).trim();
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

// Pure: Killed/Timeout count as caught; Survived/NoCoverage count as missed.
// Ignored and CompileError mutants are excluded from the denominator, same
// as Stryker's own mutation score. Keys are normalized project-relative
// paths, matching normalizeProjectPath.
export function computeFileScores(report) {
  const scores = {};
  for (const [filePath, file] of Object.entries(report.files ?? {})) {
    const countable = file.mutants.filter((m) =>
      ["Killed", "Survived", "Timeout", "NoCoverage"].includes(m.status),
    );
    if (countable.length === 0) continue;
    const caught = countable.filter((m) => m.status === "Killed" || m.status === "Timeout").length;
    scores[normalizeProjectPath(filePath)] = (caught / countable.length) * 100;
  }
  return scores;
}

// Stryker prints this exact line (ProjectReader) once per `--mutate` glob
// entry that matched nothing on disk — our one reliable, Stryker-sourced
// signal that a *requested* file was never even looked at, as opposed to a
// file Stryker did look at but found zero mutants in (a type-only or
// re-export file; absent from the JSON report either way, but there's no
// such warning for it).
const UNMATCHED_GLOB_PATTERN = /Glob pattern "([^"]+)" did not result in any files\./g;

export function parseUnmatchedFiles(output) {
  return new Set([...output.matchAll(UNMATCHED_GLOB_PATTERN)].map((m) => normalizeProjectPath(m[1])));
}

// Pure decision: given the files this run was asked to mutate (each as
// { display, key }, key being the normalized project-relative path used to
// look scores up), whether Stryker crashed before writing a (fresh — the
// caller deletes any previous one first) report at all, the scores computed
// from that report, and the set of glob patterns it could not match, decide
// the per-file outcome lines and the exit code.
//
// `crashed: true` means there is no report to read at all — a dry-run
// failure or any other crash before Stryker's JsonReporter ran — so nothing
// here can be trusted: every requested file fails. This is deliberately
// NOT driven by Stryker's own exit status, which is also non-zero when the
// run completed normally but the aggregate score is simply below the break
// threshold; in that case the report is fully trustworthy and each file
// must still be judged on its own score, not dragged down en masse because
// one batch-mate failed (Stryker writes its report only once, after every
// mutant in the run has been tested, so "a report exists" reliably means
// "the run completed"; this holds even for `crashed: false` with some files
// absent from `scores` because they genuinely had zero mutants — see
// `unmatchedFiles` below for the other reason a file can be absent).
//
// Exported and tested directly, with no git or Stryker involved, so a
// mutant in this logic (inverted threshold, wrong exit code, dropping
// NoCoverage/Timeout, missing-file-fail bypassed) gets caught here instead
// of only in a slow end-to-end run.
export function decideMutationResult({ files, crashed, scores, unmatchedFiles }) {
  if (crashed) {
    return {
      lines: [
        `Stryker produced no report (crashed before finishing) — its data cannot be trusted. Failing all ${files.length} requested file(s).`,
      ],
      exitCode: 1,
    };
  }

  const lines = [];
  let failed = false;
  for (const { display, key } of files) {
    if (unmatchedFiles.has(key)) {
      lines.push(`  ${display}: Stryker's glob did not match this file (FAIL)`);
      failed = true;
      continue;
    }
    const score = scores[key];
    if (score === undefined) {
      lines.push(`  ${display}: no mutants (type-only or re-export file, ok)`);
      continue;
    }
    const belowThreshold = score < MUTATION_BREAK_THRESHOLD;
    lines.push(`  ${display}: ${score.toFixed(2)} (${belowThreshold ? "BELOW THRESHOLD" : "ok"})`);
    if (belowThreshold) failed = true;
  }
  return { lines, exitCode: failed ? 1 : 0 };
}

function runStrykerForProject(repoRoot, project, records) {
  const projectCwd = join(repoRoot, project.cwd);
  const mutateArg = records.map((record) => record.key).join(",");

  // Requirement: never read a report left over from a previous run. If
  // Stryker crashes before writing a new one, there must be nothing here to
  // fall back to.
  rmSync(join(projectCwd, "reports", "mutation"), { recursive: true, force: true });

  const result = spawnSync("npx", ["stryker", "run", project.configFile, "--mutate", mutateArg], {
    cwd: projectCwd,
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const unmatchedFiles = parseUnmatchedFiles(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  const reportPath = join(projectCwd, "reports", "mutation", "mutation.json");
  const crashed = !existsSync(reportPath);
  const scores = crashed ? {} : computeFileScores(JSON.parse(readFileSync(reportPath, "utf8")));

  return decideMutationResult({ files: records, crashed, scores, unmatchedFiles });
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

  let exitCode = 0;
  for (const { project, files } of groups) {
    console.log(`Mutating ${files.length} file(s) in ${project.name}: ${files.join(", ")}`);
    const projectCwd = join(repoRoot, project.cwd);
    const records = files.map((file) => toRecord(repoRoot, projectCwd, file));
    const result = runStrykerForProject(repoRoot, project, records);
    for (const line of result.lines) console.log(line);
    if (result.exitCode !== 0) exitCode = 1;
  }

  if (exitCode !== 0) {
    console.error(`Mutation gate failed: a file scored below MUTATION_BREAK_THRESHOLD (${MUTATION_BREAK_THRESHOLD}), Stryker failed, or a requested file was not found.`);
  } else {
    console.log("All changed, mutation-tested files meet the break threshold.");
  }
  process.exit(exitCode);
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
