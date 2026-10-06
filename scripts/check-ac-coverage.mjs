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

// The tag(s), as they appear inside an actual test-name string:
// "(<plan>-AE<n>)". A name may carry more than one (matchAll, not exec).
const TAG_IN_NAME_PATTERN = /\((\d+-AE\d+)\)/g;

function findAllTags(text) {
  return [...text.matchAll(TAG_IN_NAME_PATTERN)].map((match) => match[1]);
}

// Strip JS/TS comments (// and /* */) before scanning for test calls, so a
// commented-out call that textually looks like `it('... (<plan>-AEn)', ...)`
// is not mistaken for a real, running test. String/template literal content
// (where "//" or "/*" may legitimately appear, e.g. in a URL) is preserved.
function stripJsComments(content) {
  let result = "";
  let state = "code"; // code | single | double | template | line | block
  for (let i = 0; i < content.length; ) {
    const ch = content[i];
    const next = content[i + 1];
    if (state === "line") {
      if (ch === "\n") {
        state = "code";
        result += ch;
      } else {
        result += " ";
      }
      i++;
      continue;
    }
    if (state === "block") {
      if (ch === "*" && next === "/") {
        state = "code";
        result += "  ";
        i += 2;
        continue;
      }
      result += ch === "\n" ? "\n" : " ";
      i++;
      continue;
    }
    if (state === "single" || state === "double" || state === "template") {
      const quote = state === "single" ? "'" : state === "double" ? '"' : "`";
      // A single/double-quoted JS string cannot contain a literal newline, so
      // a quote character that is actually inside a regex literal or JSX
      // text (e.g. "Harfhane'ye") never really opened a string: hitting a
      // newline first means the "string" state was a false positive, and it
      // must not swallow a real comment on the following line(s). A
      // template literal can genuinely span lines, so it is exempt.
      if (ch === "\n" && state !== "template") {
        state = "code";
        result += ch;
        i++;
        continue;
      }
      if (ch === "\\") {
        result += ch + (next ?? "");
        i += 2;
        continue;
      }
      result += ch;
      if (ch === quote) state = "code";
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      state = "line";
      result += "  ";
      i += 2;
      continue;
    }
    if (ch === "/" && next === "*") {
      state = "block";
      result += "  ";
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      state = ch === "'" ? "single" : ch === '"' ? "double" : "template";
      result += ch;
      i++;
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

// JS/TS: the first argument of a call to it(/test( (and their .only/.each/…
// variants), in any of the three quote styles. describe( is a suite label,
// not a test, so it is deliberately excluded. The negative lookbehind keeps
// `pattern.test(str)` (RegExp.prototype.test) from being mistaken for a
// test(...) call, on top of the identifier-boundary exclusion a plain `\b`
// already gave. A comment or an unrelated string elsewhere in the file is
// not a test name and must not count (R1/KTD1 say "test name", not "file").
// The modifier chain also tolerates a `.each(...)` or `` .each`...` ``
// segment (e.g. `it.each([1, 2])('...', fn)` or `` test.each`...`('...', fn) ``)
// interleaved with plain modifiers like `.only`/`.concurrent`, since the
// final call that actually carries the test name is the one after it.
const JS_TEST_CALL_PATTERN =
  /(?<![.\w])(?:it|test)((?:\.\w+(?:\((?:[^()]|\([^()]*\))*\)|`(?:[^`\\]|\\.)*`)?)*)\s*\(\s*(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;

// A skipped or pending test (.skip, .todo) proves nothing: it does not run.
const SKIPPED_MODIFIER_PATTERN = /\.(skip|todo)\b/;

// A whole suite skipped with describe.skip(...)/describe.todo(...) proves
// nothing either: none of the tests inside it run. The simplest reliable
// scope for "inside" is the call's own balanced parens, found by depth
// counting from the opening "(" right after the skip/todo modifier.
const SKIPPED_DESCRIBE_PATTERN = /\bdescribe\.(?:skip|todo)\s*\(/g;

function findMatchingParenIndex(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function blankRangePreservingNewlines(text, start, end) {
  let out = "";
  for (let i = start; i < end; i++) out += text[i] === "\n" ? "\n" : " ";
  return out;
}

// Blanks out (replaces with spaces, keeping line breaks) the body of every
// describe.skip(...)/describe.todo(...) call so no test call textually
// "inside" it is later matched by JS_TEST_CALL_PATTERN. A nested
// describe.skip inside another one is blanked along with its parent in the
// same pass, so it never needs separate handling.
function removeSkippedDescribeBlocks(content) {
  let result = content;
  SKIPPED_DESCRIBE_PATTERN.lastIndex = 0;
  let match = SKIPPED_DESCRIBE_PATTERN.exec(result);
  while (match) {
    const openParenIndex = match.index + match[0].length - 1;
    const closeParenIndex = findMatchingParenIndex(result, openParenIndex);
    if (closeParenIndex === -1) {
      match = SKIPPED_DESCRIBE_PATTERN.exec(result);
      continue;
    }
    const blanked = blankRangePreservingNewlines(result, match.index, closeParenIndex + 1);
    result = result.slice(0, match.index) + blanked + result.slice(closeParenIndex + 1);
    SKIPPED_DESCRIBE_PATTERN.lastIndex = closeParenIndex + 1;
    match = SKIPPED_DESCRIBE_PATTERN.exec(result);
  }
  return result;
}

function extractJsTestNameTags(content) {
  const tags = new Set();
  const scannable = removeSkippedDescribeBlocks(stripJsComments(content));
  for (const match of scannable.matchAll(JS_TEST_CALL_PATTERN)) {
    if (SKIPPED_MODIFIER_PATTERN.test(match[1])) continue;
    const name = match[2].slice(1, -1);
    for (const tag of findAllTags(name)) tags.add(tag);
  }
  return tags;
}

// Strip Python `#` comments before scanning, mirroring stripJsComments: a
// commented-out def/docstring line must not count, and content inside a
// string (including a triple-quoted docstring, where "#" may appear as
// ordinary text) is preserved.
function stripPyComments(content) {
  let result = "";
  let state = "code"; // code | single | double | triple_single | triple_double
  for (let i = 0; i < content.length; ) {
    const three = content.slice(i, i + 3);
    if (state === "triple_single" || state === "triple_double") {
      const marker = state === "triple_single" ? "'''" : '"""';
      if (three === marker) {
        result += marker;
        state = "code";
        i += 3;
        continue;
      }
      result += content[i];
      i++;
      continue;
    }
    if (state === "single" || state === "double") {
      const quote = state === "single" ? "'" : '"';
      const ch = content[i];
      if (ch === "\\") {
        result += ch + (content[i + 1] ?? "");
        i += 2;
        continue;
      }
      result += ch;
      if (ch === quote) state = "code";
      i++;
      continue;
    }
    if (three === "'''" || three === '"""') {
      state = three === "'''" ? "triple_single" : "triple_double";
      result += three;
      i += 3;
      continue;
    }
    const ch = content[i];
    if (ch === "'" || ch === '"') {
      state = ch === "'" ? "single" : "double";
      result += ch;
      i++;
      continue;
    }
    if (ch === "#") {
      while (i < content.length && content[i] !== "\n") i++;
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

// Python: a test's "name" is its function name, or the first line of its
// docstring when it has one. A trailing comment never counts. There is no
// existing tagged Python test in this repo yet to be compatible with, so
// this establishes the convention: the id in the name is written without
// parens/hyphen as "_<plan>_AE<n>" (a valid identifier suffix), or the
// docstring's first line uses the normal "(<plan>-AE<n>)" form. `async def`
// tests (pytest-asyncio etc.) are recognized the same way as plain `def`.
const PY_DEF_PATTERN = /^[ \t]*(?:async\s+)?def\s+(test_[A-Za-z0-9_]*)\s*\(/gm;
const PY_NAME_TAG_PATTERN = /_(\d+)_AE(\d+)\b/;

// @pytest.mark.skip / @unittest.skip (with or without arguments) mark a
// test that never runs, so it proves nothing. The decorator line(s)
// immediately above the def (skipping only truly blank lines) are checked;
// a non-decorator line breaks the search, since it means this def has no
// more decorators to inspect.
const PY_SKIP_DECORATOR_PATTERN = /^@(?:pytest\.mark\.skip|unittest\.skip)\b/;

function hasPySkipDecorator(lines, defLineNumber) {
  for (let i = defLineNumber - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (!trimmed.startsWith("@")) return false;
    if (PY_SKIP_DECORATOR_PATTERN.test(trimmed)) return true;
  }
  return false;
}

function extractPythonTestNameTags(content) {
  const stripped = stripPyComments(content);
  const tags = new Set();
  const lines = stripped.split("\n");
  for (const match of stripped.matchAll(PY_DEF_PATTERN)) {
    const defLineNumber = stripped.slice(0, match.index).split("\n").length - 1;
    if (hasPySkipDecorator(lines, defLineNumber)) continue;

    const nameMatch = PY_NAME_TAG_PATTERN.exec(match[1]);
    if (nameMatch) tags.add(`${nameMatch[1]}-AE${nameMatch[2]}`);

    for (let i = defLineNumber + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === "") continue;
      const docMatch = trimmed.match(/^(?:"""|''')(.*)$/);
      if (docMatch) {
        for (const tag of findAllTags(docMatch[1])) tags.add(tag);
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
