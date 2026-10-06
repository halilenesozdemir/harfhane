#!/usr/bin/env node
// Traceability check (Plan 009 KTD1, R1): every acceptance example (AE<n>) in an
// approved plan must be referenced by at least one test's own name as
// "(<plan>-AE<n>)" (a comment or an unrelated string does not count), or listed
// in docs/plans/ac-pending.txt with a reason. Exits 1 and lists missing ids
// otherwise. Also fails on: a stale pending entry (an id that is both tagged and
// still allowlisted); a pending id that matches no approved plan's AE at all (a
// typo guard); and a plan whose "Acceptance examples" heading has no AE<n>
// bullet, or a malformed one, under it (a parsing miss, not a plan with no AEs
// at all).

import { readFileSync, readdirSync, statSync, realpathSync } from "node:fs";
import { join, basename } from "node:path";
import { pathToFileURL } from "node:url";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".expo"]);

const TEST_FILE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.test\.mjs$/,
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

function readNormalized(filePath) {
  // Normalize CRLF to LF once at the source so every line-based parser below
  // (frontmatter, heading, bullet) sees a consistent line ending.
  return readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

function parseStatus(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const statusLine = match[1].match(/^status:\s*(.+)$/m);
  if (!statusLine) return null;
  // Frontmatter may quote the value (status: "approved" or status: 'approved').
  return statusLine[1].trim().replace(/^(['"])(.*)\1$/, "$2");
}

function derivePlanNumber(fileName) {
  const match = fileName.match(/^\d{4}-\d{2}-\d{2}-(\d+)-/);
  return match ? match[1] : null;
}

// A trailing suffix is tolerated on the heading itself, e.g.
// "## Acceptance examples (R1-R2)".
const HEADING_PATTERN = /^#{1,6}\s+acceptance examples(?:\s|$)/i;

function extractAcceptanceExampleSection(content) {
  const lines = content.split("\n");
  const startIndex = lines.findIndex((line) => HEADING_PATTERN.test(line.trim()));
  if (startIndex === -1) return null;
  const sectionLines = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (/^#{1,6}\s+/.test(lines[i].trim())) break;
    sectionLines.push(lines[i]);
  }
  return sectionLines;
}

// Matches a bullet's own id: "- AE1", "* AE1", "- **AE2**" (bold wrapping the
// id only). AE ids of other plans may still appear in prose elsewhere in the
// section (e.g. a traceability example quoting "Plan 008 AE7") and must not
// be mistaken for this plan's own AE, so only the bullet's leading id counts.
const BULLET_ID_PATTERN = /^[-*]\s+\*{0,2}AE(\d+)\b/;

// A line that opens a new list item ("-", "*" or "1.") but doesn't match
// BULLET_ID_PATTERN, while still containing something that looks like an AE
// id ("AE2", "AE-3"), is a malformed bullet (wrong marker, a stray hyphen
// before the number, …) rather than silently-ignored prose. A continuation
// line of a wrapped bullet never opens a new list item, so mentioning
// another plan's AE id there (as in the traceability example above) stays
// untouched.
const LIST_ITEM_START_PATTERN = /^(?:[-*]|\d+\.)\s+/;
const AE_LOOKING_TOKEN_PATTERN = /\bAE-?\d+\b/;

function extractAcceptanceExampleIds(content, planLabel) {
  const section = extractAcceptanceExampleSection(content);
  if (section === null) return [];
  const ids = new Set();
  for (const rawLine of section) {
    const line = rawLine.trim();
    const match = BULLET_ID_PATTERN.exec(line);
    if (match) {
      ids.add(match[1]);
      continue;
    }
    if (LIST_ITEM_START_PATTERN.test(line) && AE_LOOKING_TOKEN_PATTERN.test(line)) {
      throw new Error(`${planLabel} has a malformed Acceptance examples bullet: "${line}"`);
    }
  }
  if (ids.size === 0) {
    throw new Error(
      `${planLabel} has an "Acceptance examples" heading but no AE<n> bullet was found under it`,
    );
  }
  return [...ids];
}

function collectRequiredTags(plansDir) {
  const tags = [];
  for (const planFile of findPlanFiles(plansDir)) {
    const content = readNormalized(planFile);
    if (parseStatus(content) !== "approved") continue;
    const planNumber = derivePlanNumber(basename(planFile));
    if (!planNumber) continue;
    for (const aeId of extractAcceptanceExampleIds(content, basename(planFile))) {
      tags.push({ tag: `${planNumber}-AE${aeId}`, plan: basename(planFile) });
    }
  }
  return tags;
}

// The tag, as it appears inside an actual test-name string: "(<plan>-AE<n>)".
const TAG_IN_NAME_PATTERN = /\((\d+-AE\d+)\)/;

// JS/TS: the first argument of a call to it(/test(/describe( (and their
// .only/.skip/.each variants), in any of the three quote styles. A comment
// or an unrelated string elsewhere in the file is not a test name and must
// not count (R1/KTD1 say "test name", not "file").
const JS_TEST_CALL_PATTERN =
  /\b(?:it|test|describe)(?:\.\w+)*\s*\(\s*(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;

function extractJsTestNameTags(content) {
  const tags = new Set();
  for (const match of content.matchAll(JS_TEST_CALL_PATTERN)) {
    const name = match[1].slice(1, -1);
    const tagMatch = TAG_IN_NAME_PATTERN.exec(name);
    if (tagMatch) tags.add(tagMatch[1]);
  }
  return tags;
}

// Python: a test's "name" is its function name, or the first line of its
// docstring when it has one. A trailing comment never counts. There is no
// existing tagged Python test in this repo yet to be compatible with, so
// this establishes the convention: the id in the name is written without
// parens/hyphen as "_<plan>_AE<n>" (a valid identifier suffix), or the
// docstring's first line uses the normal "(<plan>-AE<n>)" form.
const PY_DEF_PATTERN = /^[ \t]*def\s+(test_[A-Za-z0-9_]*)\s*\(/gm;
const PY_NAME_TAG_PATTERN = /_(\d+)_AE(\d+)\b/;

function extractPythonTestNameTags(content) {
  const tags = new Set();
  const lines = content.split("\n");
  for (const match of content.matchAll(PY_DEF_PATTERN)) {
    const nameMatch = PY_NAME_TAG_PATTERN.exec(match[1]);
    if (nameMatch) tags.add(`${nameMatch[1]}-AE${nameMatch[2]}`);

    const defLineNumber = content.slice(0, match.index).split("\n").length - 1;
    for (let i = defLineNumber + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === "") continue;
      const docMatch = trimmed.match(/^(?:"""|''')(.*)$/);
      if (docMatch) {
        const tagMatch = TAG_IN_NAME_PATTERN.exec(docMatch[1]);
        if (tagMatch) tags.add(tagMatch[1]);
      }
      break;
    }
  }
  return tags;
}

function collectFoundTags(testFiles) {
  const found = new Set();
  for (const filePath of testFiles) {
    const content = readFileSync(filePath, "utf8");
    const tags = basename(filePath).endsWith(".py")
      ? extractPythonTestNameTags(content)
      : extractJsTestNameTags(content);
    for (const tag of tags) found.add(tag);
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
  const requiredTagSet = new Set(required.map(({ tag }) => tag));
  const testFiles = findTestFiles(rootDir);
  const found = collectFoundTags(testFiles);
  const allowlisted = collectAllowlistedTags(allowlistPath);

  const missing = required.filter(({ tag }) => !found.has(tag) && !allowlisted.has(tag));
  const stalePending = [...allowlisted].filter((tag) => found.has(tag));
  // A pending id that matches no approved plan's AE at all is a typo in
  // ac-pending.txt, not a real gap (status: done plans are out of scope for
  // R1/this check; see Not covered).
  const unknownPending = [...allowlisted].filter((tag) => !requiredTagSet.has(tag));
  return {
    missing,
    stalePending,
    unknownPending,
    requiredCount: required.length,
    foundCount: found.size,
  };
}

function main() {
  const rootDir = process.cwd();
  const plansDir = join(rootDir, "docs", "plans");
  const allowlistPath = join(plansDir, "ac-pending.txt");

  let result;
  try {
    result = checkAcCoverage({ rootDir, plansDir, allowlistPath });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const { missing, stalePending, unknownPending } = result;
  let failed = false;

  if (missing.length > 0) {
    failed = true;
    console.error("Missing acceptance-example test coverage:");
    for (const { tag, plan } of missing) {
      console.error(`  ${tag} (${plan})`);
    }
  }

  if (stalePending.length > 0) {
    failed = true;
    console.error("Stale docs/plans/ac-pending.txt entries (already tagged by a test, remove the line):");
    for (const tag of stalePending) {
      console.error(`  ${tag}`);
    }
  }

  if (unknownPending.length > 0) {
    failed = true;
    console.error("docs/plans/ac-pending.txt lists an id with no matching AE in any approved plan (typo?):");
    for (const tag of unknownPending) {
      console.error(`  ${tag}`);
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log("All acceptance examples in approved plans are covered or allowlisted.");
}

// Compare realpaths (not raw argv[1]) so this guard still recognizes direct
// execution through a symlink, a path with spaces, or a non-ASCII path (e.g.
// a home directory with Turkish characters) — `file://${process.argv[1]}`
// does not percent-encode those the way import.meta.url does, so it silently
// failed to match and main() never ran (exit 0, no output, no check).
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
