import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkAcCoverage } from "./check-ac-coverage.mjs";

function makeFixtureDirs() {
  const rootDir = mkdtempSync(join(tmpdir(), "ac-coverage-"));
  const plansDir = join(rootDir, "docs", "plans");
  mkdirSync(plansDir, { recursive: true });
  return { rootDir, plansDir, allowlistPath: join(plansDir, "ac-pending.txt") };
}

const PLAN_009_AE1_PLAN = `---
title: Fixture plan
type: test
date: 2026-10-06
status: approved
---

# Fixture plan

## Requirements
- R1. Every acceptance example is referenced by a test name.

## Acceptance examples
- AE1 (R1). Given Plan 008 lists AE1-AE7 and no test name contains "AE7", the
  traceability check fails and names Plan 008 AE7.
`;

test("should report AE1 of Plan 009 as missing when no test name tags it (009-AE1)", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "unrelated.test.ts"),
      "test('should do something unrelated', () => {});",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not report AE1 of Plan 009 as missing when a test name tags it (009-AE1)", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      "test('should fail when an AE has no test (009-AE1)', () => {});",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not report a tag as missing when it is listed in the allowlist file", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    writeFileSync(allowlistPath, "009-AE1  no test yet, tracked for later unit\n");

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should skip a plan when its status is not approved", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const draftPlan = PLAN_009_AE1_PLAN.replace("status: approved", "status: draft");
    writeFileSync(join(plansDir, "2026-10-06-010-fixture-plan.md"), draftPlan);

    const { missing, requiredCount } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.equal(requiredCount, 0);
    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should exclude node_modules when searching for test files", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const nodeModulesDir = join(rootDir, "node_modules", "some-pkg");
    mkdirSync(nodeModulesDir, { recursive: true });
    writeFileSync(
      join(nodeModulesDir, "vendored.test.ts"),
      "test('should not count (009-AE1)', () => {});",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should find a tag in a Python test file named test_*.py", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      "def test_should_pass_when_label_valid_009_AE1():\n    # (009-AE1)\n    pass\n",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
