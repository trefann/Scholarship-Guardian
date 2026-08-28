# Scholarship Guardian

Scholarship Guardian is a preparation prototype that helps a student understand possible scholarship matches, connect requirements to evidence, and catch preventable application problems before continuing to an official portal.

The signature feature is **Application X-Ray**:

`Profile → Matches → Why You Match → Evidence → Application X-Ray → Fix Issue → Re-run → Ready to Continue → Official Handoff`

## Trust model

- The included Arun Kumar profile, documents, and corrections are synthetic demo data.
- `PASS` means the supplied information supports a prototype check; it is not guaranteed eligibility.
- `REVIEWED` records that the student inspected an issue. It remains a readiness blocker while the underlying evidence still disagrees.
- `UNKNOWN` and authority-dependent `ATTENTION` results are preserved rather than guessed.
- `regular_course → course_is_prescribed_full_time` is explicitly recorded as a demo inference, not an independently verified fact.
- The government or scheme portal remains the system of record.

## Architecture

- Next.js 16 and React 19 UI deployed on Vercel.
- Versioned scholarship rules and synthetic documents in `app/data/scholarships.json`.
- Generic rule evaluation in `app/lib/rules-engine.ts`.
- Cross-document findings and readiness in `app/lib/application-evaluator.ts`.
- Same-origin server evaluation at `POST /api/evaluate` with dataset and source-verification metadata.
- A resettable anonymous demo session is stored in browser local storage. No real identity or government data is collected.

The API intentionally does not authenticate documents, call government systems, perform OCR, submit applications, or guarantee outcomes.

## Rule maintenance process

Before any public or production use:

1. Re-check each rule, document requirement, institution list, and deadline against the linked authoritative source.
2. Record a new dataset version instead of silently changing a published rule set.
3. Retain `UNKNOWN` when the current source cannot support a deterministic answer.
4. Run unit and journey tests before deployment.
5. Review the live official-handoff link and disclosure copy.

## Run locally

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

`npm run test:e2e` starts the app on port 3100 and exercises the complete Arun demo journey, including the rule that review alone cannot unlock readiness.

## Current limitations

- Three scholarship references and three synthetic documents.
- No authentication, production database, upload pipeline, OCR, authenticity check, government integration, submission, payment, or selection prediction.
- Demo state is local to one browser. A production implementation would require encrypted persistence, consent, retention controls, audit logging, and a reviewed data-update workflow.
