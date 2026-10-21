(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.JobShieldCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const evidenceRules = [
    [/immediate|urgent|quickly|today|now/i, "Time pressure"],
    [/£\s?\d+|salary|paying|per week|per hour/i, "Pay claim"],
    [/whatsapp|telegram|signal/i, "Messaging-channel recruitment"],
    [/remote|work from home/i, "Remote-work claim"],
    [/payment|fee|deposit|transfer|crypto|gift card/i, "Money-related wording"],
  ];

  function extractEvidence(source) {
    const evidence = [];
    evidenceRules.forEach(([pattern, label]) => {
      const match = source.match(pattern);
      if (!match) return;
      const index = match.index || 0;
      evidence.push({
        label,
        snippet: source.slice(Math.max(0, index - 55), Math.min(source.length, index + 100)).trim(),
      });
    });
    return evidence;
  }

  function generateFindings(source) {
    const findings = [];
    if (/immediate|urgent|quickly|today|now/i.test(source)) findings.push({
      notice: "The message uses time-pressure language.",
      meaning: "Pressure can reduce the time available for independent checks.",
      action: "Do not rush. Verify the vacancy through the employer's official website or switchboard.",
    });
    if (/whatsapp|telegram|signal/i.test(source)) findings.push({
      notice: "Recruitment is being moved through a messaging channel.",
      meaning: "A messaging account alone does not establish recruiter authority.",
      action: "Confirm the recruiter through an independently sourced company contact.",
    });
    if (/£\s?\d+|salary|paying|per week|per hour/i.test(source)) findings.push({
      notice: "The message contains a pay claim.",
      meaning: "Pay is a factual claim that can be checked against an official vacancy or employer contact.",
      action: "Compare the role, salary and employment terms with an official source.",
    });
    if (/no payment|no fee/i.test(source)) findings.push({
      notice: "The source explicitly says no payment is required.",
      meaning: "JobShield must preserve that evidence and must not invent a payment request.",
      action: "Continue checking the other claims independently; absence of a payment request does not prove the offer genuine.",
    });
    return findings;
  }

  function reviewIsCurrent(reviewedSource, currentSource, confirmed) {
    return confirmed === true && reviewedSource !== null && reviewedSource === currentSource;
  }

  function createCaseReport({ source, reviewedSource, confirmed, evidence, findings, caseLabel }) {
    if (!reviewIsCurrent(reviewedSource, source, confirmed)) {
      throw new Error("The current source has not been confirmed by a human reviewer.");
    }
    if (!Array.isArray(evidence) || !Array.isArray(findings)) {
      throw new Error("Evidence and findings are required before export.");
    }
    const evidenceText = evidence.length
      ? evidence.map((item) => `- ${item.label}: ${item.snippet}`).join("\n")
      : "- No configured evidence patterns were found.";
    const findingText = findings.length
      ? findings.map((item, index) => [
          `${index + 1}. NOTICE: ${item.notice}`,
          `   MEANING: ${item.meaning}`,
          `   ACTION: ${item.action}`,
        ].join("\n")).join("\n\n")
      : "No rule-based concerns were generated from the confirmed evidence.";

    return [
      "JOBSHIELD AI CASE REPORT",
      `Case: ${caseLabel || "user-provided source"}`,
      "",
      "SOURCE SNAPSHOT REVIEWED",
      source,
      "",
      "EVIDENCE SNIPPETS",
      evidenceText,
      "",
      "RULE-BASED FINDINGS",
      findingText,
      "",
      "Human review: confirmed for this exact source snapshot",
      "This report preserves evidence and recommended verification steps. It does not declare fraud.",
      "",
      "Check the claim. Preserve the evidence. You decide.",
    ].join("\n");
  }

  return { extractEvidence, generateFindings, reviewIsCurrent, createCaseReport };
});
