import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MUTATION_BREAK_THRESHOLD,
  groupChangedFilesByProject,
  computeFileScores,
} from "./mutation-changed.mjs";

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

// Stryker JSON report fixture, shaped like reports/mutation/mutation.json:
// one file with a killed mutant and one surviving duplicate-letter mutant,
// which is the AE6 scenario (a suite that lets a duplicate-letter mutant
// survive) — built here, not by running Stryker, so the test is
// deterministic and fast.
function fixtureReport({ survivedCount, killedCount }) {
  const mutants = [];
  for (let i = 0; i < killedCount; i++) {
    mutants.push({ id: String(i), status: "Killed" });
  }
  for (let i = 0; i < survivedCount; i++) {
    mutants.push({ id: `s${i}`, status: "Survived" });
  }
  return { files: { "src/game/evaluate.ts": { mutants } } };
}

test("should report the file's score and flag it below MUTATION_BREAK_THRESHOLD when a duplicate-letter mutant survives (009-AE6)", () => {
  // 6 killed, 4 survived (one of them the duplicate-letter mutant) = 60%,
  // below the 70 break threshold.
  const report = fixtureReport({ killedCount: 6, survivedCount: 4 });

  const scores = computeFileScores(report);

  assert.equal(scores["src/game/evaluate.ts"], 60);
  assert.ok(scores["src/game/evaluate.ts"] < MUTATION_BREAK_THRESHOLD);
});

test("should not flag a file at or above MUTATION_BREAK_THRESHOLD", () => {
  const report = fixtureReport({ killedCount: 7, survivedCount: 3 });

  const scores = computeFileScores(report);

  assert.equal(scores["src/game/evaluate.ts"], 70);
  assert.ok(scores["src/game/evaluate.ts"] >= MUTATION_BREAK_THRESHOLD);
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

  const scores = computeFileScores(report);

  assert.equal(scores["src/game/evaluate.ts"], 100);
});

test("should omit a file with no countable mutants from the scores", () => {
  const report = {
    files: {
      "src/game/evaluate.ts": { mutants: [{ id: "0", status: "Ignored" }] },
    },
  };

  const scores = computeFileScores(report);

  assert.equal(scores["src/game/evaluate.ts"], undefined);
});
