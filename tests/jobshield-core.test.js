const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../jobshield-core.js");

test("embedded words do not invent time-pressure evidence", () => {
  for (const source of ["A known employer welcomes applications.", "Please acknowledge the role description.", "The position is currently unknown."]) {
    assert.equal(core.extractEvidence(source).some(x => x.label === "Time pressure"), false);
    assert.equal(core.generateFindings(source).some(x => /time-pressure/.test(x.notice)), false);
  }
});

test("standalone pressure words remain detectable with punctuation and case", () => {
  for (const word of ["IMMEDIATE", "Urgent!", "quickly", "today.", "now!"]) {
    assert.equal(core.extractEvidence(word).some(x => x.label === "Time pressure"), true);
    assert.equal(core.generateFindings(word).some(x => /time-pressure/.test(x.notice)), true);
  }
});

const reviewed = "Immediate remote role paying £850 per week. Reply on WhatsApp today. No payment is required.";

test("a changed source invalidates the human review", () => {
  assert.equal(core.reviewIsCurrent(reviewed, reviewed, true), true);
  assert.equal(core.reviewIsCurrent(reviewed, `${reviewed} Send a fee.`, true), false);
  assert.equal(core.reviewIsCurrent(reviewed, reviewed, false), false);
});

test("report export fails closed without review of the exact source", () => {
  const evidence = core.extractEvidence(reviewed);
  const findings = core.generateFindings(reviewed);
  assert.throws(
    () => core.createCaseReport({ source: reviewed, reviewedSource: null, confirmed: false, evidence, findings }),
    /not been confirmed/,
  );
  assert.throws(
    () => core.createCaseReport({ source: `${reviewed} Changed`, reviewedSource: reviewed, confirmed: true, evidence, findings }),
    /not been confirmed/,
  );
});

test("no-payment wording is preserved without inventing a payment request", () => {
  const findings = core.generateFindings(reviewed);
  const combined = findings.map((item) => Object.values(item).join(" ")).join(" ");
  assert.match(combined, /explicitly says no payment is required/);
  assert.doesNotMatch(combined, /requested a payment|asked for a fee/);
});

test("the report contains the reviewed source, evidence and actionable findings", () => {
  const evidence = core.extractEvidence(reviewed);
  const findings = core.generateFindings(reviewed);
  const report = core.createCaseReport({
    source: reviewed,
    reviewedSource: reviewed,
    confirmed: true,
    evidence,
    findings,
    caseLabel: "JS-001 fictional sample",
  });
  assert.match(report, /SOURCE SNAPSHOT REVIEWED/);
  assert.match(report, /EVIDENCE SNIPPETS/);
  assert.match(report, /RULE-BASED FINDINGS/);
  assert.match(report, /Human review: confirmed for this exact source snapshot/);
  assert.match(report, /does not declare fraud/);
});

test("empty evidence remains a valid, uncertain outcome", () => {
  const source = "Thank you for your interest.";
  const report = core.createCaseReport({
    source,
    reviewedSource: source,
    confirmed: true,
    evidence: core.extractEvidence(source),
    findings: core.generateFindings(source),
  });
  assert.match(report, /No configured evidence patterns were found/);
  assert.match(report, /No rule-based concerns were generated/);
});
