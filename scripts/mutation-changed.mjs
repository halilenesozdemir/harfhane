#!/usr/bin/env node
// Changed-files mutation gate (Plan 009 KTD4, R7, R10). Finds the files this
// branch changed (committed since it diverged from origin/main, plus
// anything still uncommitted) under the paths Stryker is wired for, excludes
// test files, and runs Stryker's `--mutate` on exactly those files so a PR
// only pays for mutating what it touched. Exits non-zero when any changed
// file's mutation score is below MUTATION_BREAK_THRESHOLD, and exits 0 with
// a message when nothing relevant changed.
//
// apps/backend/src/{services,repositories} is not in PROJECTS yet: Stryker's
// vitest-runner runs vitest through its own Node-API invocation, which does
// not go through the Cloudflare Workers Vitest pool, so any backend test
// touching a D1 binding or a Workers-only API (e.g. crypto.subtle's
// timingSafeEqual) fails in Stryker's dry run even though it passes under
// `pnpm --filter @harfhane/backend run test`. See docs/backlog.md.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
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

function runGit(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function splitNonEmptyLines(text) {
  return text.split("\n").filter((line) => line.length > 0);
}

// Committed-since-divergence changes plus whatever is still uncommitted
// (staged, unstaged or untracked), deduplicated.
export function getChangedFiles({ repoRoot, baseRef = "origin/main" }) {
  const committed = splitNonEmptyLines(runGit(["diff", "--name-only", `${baseRef}...HEAD`], repoRoot));
  const uncommitted = splitNonEmptyLines(runGit(["diff", "--name-only", "HEAD"], repoRoot));
  const untracked = splitNonEmptyLines(runGit(["ls-files", "--others", "--exclude-standard"], repoRoot));
  return [...new Set([...committed, ...uncommitted, ...untracked])];
}

// Pure: Killed/Timeout count as caught; Survived/NoCoverage count as missed.
// Ignored and CompileError mutants are excluded from the denominator, same
// as Stryker's own mutation score.
export function computeFileScores(report) {
  const scores = {};
  for (const [filePath, file] of Object.entries(report.files ?? {})) {
    const countable = file.mutants.filter((m) =>
      ["Killed", "Survived", "Timeout", "NoCoverage"].includes(m.status),
    );
    if (countable.length === 0) continue;
    const caught = countable.filter((m) => m.status === "Killed" || m.status === "Timeout").length;
    scores[filePath] = (caught / countable.length) * 100;
  }
  return scores;
}

function runStrykerForProject(repoRoot, project, files) {
  const relativeToProject = files.map((file) => relative(project.cwd, join(repoRoot, file)));
  const result = spawnSync(
    "npx",
    ["stryker", "run", project.configFile, "--mutate", relativeToProject.join(",")],
    { cwd: join(repoRoot, project.cwd), stdio: "inherit", encoding: "utf8" },
  );
  const reportPath = join(repoRoot, project.cwd, "reports", "mutation", "mutation.json");
  if (!existsSync(reportPath)) {
    throw new Error(`${project.name}: Stryker produced no report at ${reportPath} (exit ${result.status})`);
  }
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  return computeFileScores(report);
}

function main() {
  const repoRoot = runGit(["rev-parse", "--show-toplevel"], process.cwd()) || process.cwd();
  const changedFiles = getChangedFiles({ repoRoot });
  const groups = groupChangedFilesByProject(changedFiles);

  if (groups.length === 0) {
    console.log("No changed files under a mutation-tested path; skipping mutation testing.");
    process.exit(0);
  }

  let failed = false;
  for (const { project, files } of groups) {
    console.log(`Mutating ${files.length} file(s) in ${project.name}: ${files.join(", ")}`);
    const scores = runStrykerForProject(repoRoot, project, files);
    for (const file of files) {
      const relativeToProject = relative(project.cwd, join(repoRoot, file));
      const score = scores[relativeToProject];
      if (score === undefined) {
        console.log(`  ${file}: no mutants reported`);
        continue;
      }
      const status = score < MUTATION_BREAK_THRESHOLD ? "BELOW THRESHOLD" : "ok";
      console.log(`  ${file}: ${score.toFixed(2)} (${status})`);
      if (score < MUTATION_BREAK_THRESHOLD) failed = true;
    }
  }

  if (failed) {
    console.error(`Mutation score below MUTATION_BREAK_THRESHOLD (${MUTATION_BREAK_THRESHOLD}).`);
    process.exit(1);
  }
  console.log("All changed, mutation-tested files meet the break threshold.");
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
