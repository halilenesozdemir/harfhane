#!/usr/bin/env node
// Changed-files selection for the mutation gate (Plan 009 KTD4, R7). Finds
// the files this branch changed (committed since it diverged from local
// origin/main, plus anything still uncommitted) under the paths Stryker is
// wired for, excluding test files. The scoring/decision/run logic that
// turns this file list into a pass/fail gate ships in a follow-up unit
// (PR B of Plan 009 U6); this file is a library module with no CLI
// behavior of its own yet.
//
// apps/backend/src/{services,repositories} is not in PROJECTS yet: Stryker's
// vitest-runner runs vitest through its own Node-API invocation, which does
// not go through the Cloudflare Workers Vitest pool, so any backend test
// touching a D1 binding or a Workers-only API (e.g. crypto.subtle's
// timingSafeEqual) fails in Stryker's dry run even though it passes under
// `pnpm --filter @harfhane/backend run test`. See docs/backlog.md.

import { execFileSync } from "node:child_process";

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
// because of a backslash (Windows) or a leading "./". Used by the
// scoring/decision module (PR B) to key into Stryker's report; kept here
// because getChangedFiles's callers need the same normalization.
export function normalizeProjectPath(path) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "");
}
