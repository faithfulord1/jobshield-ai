# Evidence integrity repair: 21 October 2026

## Confirmed repository state

- Target: `faithfulord1/jobshield-ai`, public repository owned by Faith Wright.
- Base: `8b8ac96347365eb0337ad1056bff36d3e5709a6d` on `main`.
- Licence: MIT.
- No open pull request or `AGENTS.md` was found at inspection.
- The app is a static browser prototype with no backend, datastore, model or live
  external verification service. It processes text in the user's browser.

## Verified problem

The previous browser flow displayed evidence from one source snapshot, but the
user could edit the textarea before generating findings. Findings then used the
new source while the human confirmation referred to the earlier snippets. The
download function also wrote `Human review: confirmed` without checking that the
current source had been reviewed or that findings had been generated.

That broke the documented chain: source -> evidence -> human confirmation ->
findings -> report. It could create a report whose review statement was not tied
to its source text.

## Change

- Added a dependency-free core module for evidence extraction, findings, exact
  source-review binding and report generation.
- Editing or reloading source text invalidates earlier review state and hides
  results until the current text is reviewed again.
- Findings fail closed unless the confirmed source exactly matches the reviewed
  source snapshot.
- Download fails closed until findings exist for that confirmed snapshot.
- The report now includes the reviewed source, evidence snippets and findings.
- A fictional sample is labelled separately from user-provided text.

No source is uploaded or persisted by this change. No fraud verdict, report to a
third party, company lookup, outbound message or automated decision was added.

## Verification

Executed locally with Node.js built-in tools only:

- `node --test tests/jobshield-core.test.js`: 5 passed, 0 failed.
- `node --check jobshield-core.js`: passed.
- `git diff --check`: passed.
- Negative control: temporarily weakened exact-source binding in an isolated
  copy. Two regression tests failed as expected. Production source was unchanged.

Tests cover changed-source invalidation, unreviewed export rejection, faithful
handling of explicit no-payment wording, complete report evidence, and the valid
no-pattern outcome. Browser rendering, download behaviour across browsers and a
public deployment have not been verified in this run.

## Free-first reliability plan

Plan A: GitHub Pages or another authorised static host after review and merge;
run the dependency-free checks in GitHub Actions before publishing.

Plan B: open `index.html` locally from the repository. The feature has no paid
API, server or package dependency. The same `node --test` command verifies the
decision logic offline.

## Status

- DONE: source-review binding, fail-closed export, report evidence, tests and CI.
- WAITING: draft review and remote CI result.
- BLOCKED: live deployment verification until an authorised hosting target is
  identified and publication is approved.
- NEXT: review the draft, then test the complete browser flow with fictional data
  on the authorised deployed URL.
