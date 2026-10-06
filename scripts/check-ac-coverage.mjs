#!/usr/bin/env node
// Traceability check (Plan 009 KTD1, R1): every acceptance example (AE<n>) in an
// approved plan must be referenced by at least one test name as "(<plan>-AE<n>)",
// or listed in docs/plans/ac-pending.txt with a reason. Exits 1 and lists missing
// ids otherwise.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".expo"]);

const TEST_FILE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.spec\.ts$/,
  /^test_.*\.py$/,
];

function isTestFile(fileName) {
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, onFile);
    } else if (stats.isFile()) {
      onFile(fullPath);
    }
  }
}

function findTestFiles(rootDir) {
  const files = [];
  walk(rootDir, (filePath) => {
    if (isTestFile(basename(filePath))) files.push(filePath);
  });
  return files;
}

function findPlanFiles(plansDir) {
  const files = [];
  for (const entry of readdirSync(plansDir)) {
    if (entry.endsWith(".md") && entry !== "README.md") {
      files.push(join(plansDir, entry));
    }
  }
  return files;
}

function parseStatus(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const statusLine = match[1].match(/^status:\s*(.+)$/m);
  return statusLine ? statusLine[1].trim() : null;
}

function derivePlanNumber(fileName) {
  const match = fileName.match(/^\d{4}-\d{2}-\d{2}-(\d+)-/);
  return match ? match[1] : null;
}

function extractAcceptanceExampleSection(content) {
  const lines = content.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === "## Acceptance examples");
  if (startIndex === -1) return [];
  const sectionLines = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    sectionLines.push(lines[i]);
  }
  return sectionLines;
}

function extractAcceptanceExampleIds(content) {
  const ids = new Set();
  // Only a bullet's own id counts; AE ids of other plans may appear in prose
  // (e.g. a traceability example quoting "Plan 008 AE7").
  for (const line of extractAcceptanceExampleSection(content)) {
    const match = line.match(/^- AE(\d+)\b/);
    if (match) ids.add(match[1]);
  }
  return [...ids];
}

function collectRequiredTags(plansDir) {
  const tags = [];
  for (const planFile of findPlanFiles(plansDir)) {
    const content = readFileSync(planFile, "utf8");
    if (parseStatus(content) !== "approved") continue;
    const planNumber = derivePlanNumber(basename(planFile));
    if (!planNumber) continue;
    for (const aeId of extractAcceptanceExampleIds(content)) {
      tags.push({ tag: `${planNumber}-AE${aeId}`, plan: basename(planFile) });
    }
  }
  return tags;
}

function collectFoundTags(testFiles) {
  const found = new Set();
  const tagPattern = /\((\d+-AE\d+)\)/g;
  for (const filePath of testFiles) {
    const content = readFileSync(filePath, "utf8");
    for (const match of content.matchAll(tagPattern)) {
      found.add(match[1]);
    }
  }
  return found;
}

function collectAllowlistedTags(allowlistPath) {
  const allowlisted = new Set();
  let content;
  try {
    content = readFileSync(allowlistPath, "utf8");
  } catch {
    return allowlisted;
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(\d+-AE\d+)\b/);
    if (match) allowlisted.add(match[1]);
  }
  return allowlisted;
}

export function checkAcCoverage({ rootDir, plansDir, allowlistPath }) {
  const required = collectRequiredTags(plansDir);
  const testFiles = findTestFiles(rootDir);
  const found = collectFoundTags(testFiles);
  const allowlisted = collectAllowlistedTags(allowlistPath);

  const missing = required.filter(({ tag }) => !found.has(tag) && !allowlisted.has(tag));
  return { missing, requiredCount: required.length, foundCount: found.size };
}

function main() {
  const rootDir = process.cwd();
  const plansDir = join(rootDir, "docs", "plans");
  const allowlistPath = join(plansDir, "ac-pending.txt");

  const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

  if (missing.length > 0) {
    console.error("Missing acceptance-example test coverage:");
    for (const { tag, plan } of missing) {
      console.error(`  ${tag} (${plan})`);
    }
    process.exit(1);
  }

  console.log("All acceptance examples in approved plans are covered or allowlisted.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
