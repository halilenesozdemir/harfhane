import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkAcCoverage } from "./check-ac-coverage.mjs";

const SCRIPT_PATH = fileURLToPath(new URL("./check-ac-coverage.mjs", import.meta.url));

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

test("should find a tag in a .test.mjs file", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "checker.test.mjs"),
      "test('should fail when an AE has no test (009-AE1)', () => {});",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should fail when an id is tagged by a test and still listed in the allowlist (stale pending entry)", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      "test('should fail when an AE has no test (009-AE1)', () => {});",
    );
    writeFileSync(allowlistPath, "009-AE1  stale reason, a test already proves this\n");

    const { stalePending } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(stalePending, ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not report a stale pending entry when the id is only allowlisted, not tagged", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    writeFileSync(allowlistPath, "009-AE1  no test yet, tracked for later unit\n");

    const { stalePending } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(stalePending, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should tolerate CRLF line endings in the plan file", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const crlfPlan = PLAN_009_AE1_PLAN.replace(/\n/g, "\r\n");
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), crlfPlan);

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should treat a quoted status: \"approved\" the same as an unquoted one", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const quotedStatusPlan = PLAN_009_AE1_PLAN.replace("status: approved", 'status: "approved"');
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), quotedStatusPlan);

    const { requiredCount, missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.equal(requiredCount, 1);
    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize an 'Acceptance Examples' heading at any level and case", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const altHeadingPlan = PLAN_009_AE1_PLAN.replace(
      "## Acceptance examples",
      "### acceptance EXAMPLES",
    );
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), altHeadingPlan);

    const { requiredCount } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.equal(requiredCount, 1);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize '* AEn' and '- **AEn**' bullet forms, not just '- AEn'", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const plan = `---
title: Fixture plan
type: test
date: 2026-10-06
status: approved
---

# Fixture plan

## Requirements
- R1. Two acceptance examples in non-standard bullet forms.

## Acceptance examples
* AE1 (R1). Written with an asterisk bullet.
- **AE2** (R1). Written with the id wrapped in bold.
`;
    writeFileSync(join(plansDir, "2026-10-06-012-fixture-plan.md"), plan);

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(
      missing.map((m) => m.tag).sort(),
      ["012-AE1", "012-AE2"],
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should throw when an approved plan has an Acceptance examples heading but no AE id bullet", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const emptySectionPlan = `---
title: Fixture plan
type: test
date: 2026-10-06
status: approved
---

# Fixture plan

## Requirements
- R1. Not written yet.

## Acceptance examples
TBD, not written yet.

## Key technical decisions
- KTD1. None yet.
`;
    writeFileSync(join(plansDir, "2026-10-06-013-fixture-plan.md"), emptySectionPlan);

    assert.throws(
      () => checkAcCoverage({ rootDir, plansDir, allowlistPath }),
      /Acceptance examples/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should exit 1 and print the missing AE id when run as a CLI, even through a symlinked script path (009-AE1)", () => {
  const { rootDir, plansDir } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const symlinkPath = join(rootDir, "check-ac-coverage-symlink.mjs");
    symlinkSync(SCRIPT_PATH, symlinkPath);

    const result = spawnSync(process.execPath, [symlinkPath], { cwd: rootDir, encoding: "utf8" });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /009-AE1/);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should exit 0 and print the success message when run as a CLI against a fully covered fixture (009-AE1)", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    writeFileSync(allowlistPath, "009-AE1  covered via CLI fixture\n");

    const result = spawnSync(process.execPath, [SCRIPT_PATH], { cwd: rootDir, encoding: "utf8" });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /covered or allowlisted/);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
