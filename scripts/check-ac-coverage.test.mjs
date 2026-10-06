import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkAcCoverage } from "./check-ac-coverage.mjs";

const SCRIPT_PATH = fileURLToPath(new URL("./check-ac-coverage.mjs", import.meta.url));

// Built by concatenation so this file's own source never contains the
// contiguous substring "(009-AE1)" except inside this file's own real test
// names below — a fixture string assembled with this constant, written into
// a throwaway test file, must not make itself (this file) satisfy 009-AE1
// just because the text happens to look like a test() call.
const AE1_TAG = "(" + "009-AE1" + ")";

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
      `test('should fail when an AE has no test ${AE1_TAG}', () => {});`,
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
      `test('should not count ${AE1_TAG}', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a tag that only appears in a Python comment, not in the test's name", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      `def test_should_pass_when_label_valid():\n    # ${AE1_TAG}\n    pass\n`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should find a tag written as a '_<plan>_AE<n>' suffix on a Python test function name", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      "def test_should_pass_when_label_valid_009_AE1():\n    pass\n",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should find a tag in the first line of a Python test's docstring", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      `def test_should_pass_when_label_valid():\n    """should accept a valid label ${AE1_TAG}"""\n    pass\n`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a tag that only appears in a JS/TS comment, not in the test's name", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `// ${AE1_TAG}\ntest('should do something unrelated', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
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
      `test('should fail when an AE has no test ${AE1_TAG}', () => {});`,
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
      `test('should fail when an AE has no test ${AE1_TAG}', () => {});`,
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

test("should recognize an 'Acceptance examples' heading with a trailing suffix", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const suffixedHeadingPlan = PLAN_009_AE1_PLAN.replace(
      "## Acceptance examples",
      "## Acceptance examples (R1-R2)",
    );
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), suffixedHeadingPlan);

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

test("should throw on a numbered-list AE bullet ('1. AE2'), not silently skip it", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const numberedBulletPlan = `---
title: Fixture plan
type: test
date: 2026-10-06
status: approved
---

# Fixture plan

## Requirements
- R1. One acceptance example, written as a numbered list item by mistake.

## Acceptance examples
1. AE2 (R1). Should have been a "-" bullet.
`;
    writeFileSync(join(plansDir, "2026-10-06-014-fixture-plan.md"), numberedBulletPlan);

    assert.throws(
      () => checkAcCoverage({ rootDir, plansDir, allowlistPath }),
      /malformed/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should throw on a bullet with a stray hyphen before the number ('- AE-3')", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    const hyphenatedBulletPlan = `---
title: Fixture plan
type: test
date: 2026-10-06
status: approved
---

# Fixture plan

## Requirements
- R1. One acceptance example, written with a stray hyphen before the number.

## Acceptance examples
- AE-3 (R1). Should have been "AE3", not "AE-3".
`;
    writeFileSync(join(plansDir, "2026-10-06-015-fixture-plan.md"), hyphenatedBulletPlan);

    assert.throws(
      () => checkAcCoverage({ rootDir, plansDir, allowlistPath }),
      /malformed/,
    );
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not flag a continuation line of a wrapped bullet that mentions another plan's AE id in prose", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    // PLAN_009_AE1_PLAN's own AE1 bullet wraps onto a second line that reads
    // "traceability check fails and names Plan 008 AE7." — a continuation
    // line, not a new list item, so it must not be treated as malformed.
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);

    const { requiredCount } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.equal(requiredCount, 1);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should fail when ac-pending.txt lists an id matching no AE in any approved plan (typo guard)", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    writeFileSync(allowlistPath, "009-AE99  typo, Plan 009 has no AE99\n");

    const { unknownPending } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(unknownPending, ["009-AE99"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not flag a pending id as unknown when it matches a real approved plan's AE", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    writeFileSync(allowlistPath, "009-AE1  no test yet, tracked for later unit\n");

    const { unknownPending } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(unknownPending, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

// Round-4 hardening: scanner should not be fooled by commented-out code,
// skipped/pending tests, RegExp.prototype.test( calls, or describe( suite
// names, and should recognize multiple tags on one test and async Python
// tests.
const AE2_TAG = "(" + "009-AE2" + ")";

const PLAN_009_TWO_AE_PLAN = `---
title: Fixture plan
type: test
date: 2026-10-06
status: approved
---

# Fixture plan

## Requirements
- R1. Two acceptance examples, each referenced by its own test name.

## Acceptance examples
- AE1 (R1). First acceptance example.
- AE2 (R1). Second acceptance example.
`;

test("should not count a tag inside a commented-out single-line it() call as covering it", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `// it('should fail when an AE has no test ${AE1_TAG}', () => {});\ntest('should do something unrelated', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a tag inside a block-commented it() call as covering it", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `/*\nit('should fail when an AE has no test ${AE1_TAG}', () => {});\n*/\ntest('should do something unrelated', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a tag on an it.skip test as covering it", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `it.skip('should fail when an AE has no test ${AE1_TAG}', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a tag on a test.todo test as covering it", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `test.todo('should fail when an AE has no test ${AE1_TAG}');`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a RegExp.prototype.test( call as a test name", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `const pattern = /x/;\nif (pattern.test('${AE1_TAG}')) { doSomething(); }`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a describe( block's own name as tagging an AE", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `describe('covers ${AE1_TAG}', () => {\n  it('does something else', () => {});\n});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should find multiple AE tags inside a single test name", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_TWO_AE_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `test('covers both ${AE1_TAG} and ${AE2_TAG}', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize an 'async def test_...' Python function as a tagged test", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      "async def test_should_pass_when_label_valid_009_AE1():\n    pass\n",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize a tag in an it.each(array)('name', fn) call", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `it.each([1, 2, 3])('should handle %i ${AE1_TAG}', (n) => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize a tag in a test.each`table`('name') call", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      "test.each`a | b\n${1} | ${2}`('should handle ${a} and ${b} " + AE1_TAG + "', ({ a, b }) => {});",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize a tag on an it.each(...) call combined with .only", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `it.only.each([1, 2])('should handle %i ${AE1_TAG}', (n) => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize a tag in an it.each<[T, T]>(array)('name', fn) call with a TS generic", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `it.each<[string, string]>([['a', 'b']])('should handle %s and %s ${AE1_TAG}', (a, b) => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should recognize a tag on a test.concurrent(...) call", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `test.concurrent('should run concurrently ${AE1_TAG}', async () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a quote inside a regex literal as hiding a following comment that contains a fake test call", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `const pattern = /["]/;\n// it('fake ${AE1_TAG}')\ntest('should do something unrelated', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count an apostrophe in JSX text as hiding a following comment that contains a fake test call", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `const el = <p>Harfhane'ye hoş geldin</p>;\n// it('fake ${AE1_TAG}')\ntest('should do something unrelated', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not treat an escaped quote inside a single-quoted string as ending the string early", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `const s = 'it\\'s // x';\n// it('fake ${AE1_TAG}')\ntest('should do something unrelated', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not treat '//' inside a template literal as a comment", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `const url = \`https://example.com // not a comment\`;\ntest('should fail when an AE has no test ${AE1_TAG}', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a test inside a describe.skip(...) block as covering its tag", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `describe.skip('suite', () => {\n  it('should fail when an AE has no test ${AE1_TAG}', () => {});\n});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a test inside a describe.todo(...) block as covering its tag", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `describe.todo('suite', () => {\n  it('should fail when an AE has no test ${AE1_TAG}', () => {});\n});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should still count a tag on a test outside a describe.skip(...) block in the same file", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.test.ts"),
      `describe.skip('suite', () => {\n  it('should do something skipped', () => {});\n});\ntest('should fail when an AE has no test ${AE1_TAG}', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a Python test decorated with @pytest.mark.skip", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      "@pytest.mark.skip(reason='not ready')\ndef test_should_pass_when_label_valid_009_AE1():\n    pass\n",
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not count a Python test decorated with @unittest.skip", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      '@unittest.skip("not ready")\ndef test_should_pass_when_label_valid_009_AE1():\n    pass\n',
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should not use a later unrelated triple-quoted string as a test's docstring once the first non-empty line was not one", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    const scriptsDir = join(rootDir, "scripts", "words");
    mkdirSync(scriptsDir, { recursive: true });
    writeFileSync(
      join(scriptsDir, "test_validate_labels.py"),
      `def test_should_pass_when_label_valid():\n    x = 1\n    """${AE1_TAG}"""\n    pass\n`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing.map((m) => m.tag), ["009-AE1"]);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test("should find a tag in a .spec.ts test file", () => {
  const { rootDir, plansDir, allowlistPath } = makeFixtureDirs();
  try {
    writeFileSync(join(plansDir, "2026-10-06-009-fixture-plan.md"), PLAN_009_AE1_PLAN);
    mkdirSync(join(rootDir, "scripts"), { recursive: true });
    writeFileSync(
      join(rootDir, "scripts", "traceability.spec.ts"),
      `test('should fail when an AE has no test ${AE1_TAG}', () => {});`,
    );

    const { missing } = checkAcCoverage({ rootDir, plansDir, allowlistPath });

    assert.deepEqual(missing, []);
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
