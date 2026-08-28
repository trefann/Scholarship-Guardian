'use client';

import Link from 'next/link';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { evaluateApplication } from '@/app/lib/application-evaluator';
import type { ScholarshipDataset } from '@/app/lib/types';
import { AppHeader } from './app-header';

const dataset = source as ScholarshipDataset;

export function ReadyView({ id }: { id: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === id);
  const { profile, evidenceDocuments, reviewStates, reviewStateHydrated } = useAppState();
  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Scholarship not found</h1></section></main>;
  if (!reviewStateHydrated) return <main><AppHeader step="xray" scholarshipId={id} /><section className="ready-page"><div className="review-loading" role="status">Loading your saved demo review…</div></section></main>;
  const report = evaluateApplication(scholarship, profile, evidenceDocuments, reviewStates[id]?.reviewedFindingIds ?? []);
  if (report.readiness !== 'READY_TO_APPLY') {
    return <main><AppHeader step="xray" scholarshipId={id} /><section className="ready-page"><Link className="back-link" href={`/xray/${id}`}>← Application X-Ray</Link><div className="not-ready-handoff"><span aria-hidden="true">!</span><p className="eyebrow">Not ready yet</p><h1>A preventable issue still needs correction.</h1><p>Reviewing an issue does not resolve it. Guardian derives readiness from the current evidence and cannot be bypassed by opening this screen directly.</p><ul>{report.unresolvedPreventable.map((finding) => <li key={finding.id}>{finding.title}: {finding.recommendedAction}</li>)}</ul><Link className="button button-primary" href={`/xray/${id}`}>Return to X-Ray</Link></div></section></main>;
  }
  const officialSource = scholarship.sources[0];
  return (
    <main><AppHeader step="xray" scholarshipId={id} /><section className="ready-page"><Link className="back-link" href={`/xray/${id}`}>← Application X-Ray</Link>
      <section className="ready-hero"><span className="ready-mark" aria-hidden="true">✓</span><p className="eyebrow">Guardian readiness</p><h1>Ready to continue</h1><p>Guardian found no known preventable blocker in this prototype inspection. This does not guarantee eligibility, selection, sanction, or payment.</p></section>
      <div className="handoff-grid"><section><p className="eyebrow">Guardian assessment</p><ul className="checked-list"><li><span>✓</span>Your information compared with prototype rules</li><li><span>✓</span>Required demo evidence prepared</li><li><span>✓</span>Structured demo documents are internally consistent</li><li><span>✓</span>No known preventable blocker remains</li></ul></section><section><p className="eyebrow">Still outside Guardian’s control</p><ul className="unknown-list">{scholarship.unknowns.map((unknown) => <li key={unknown}><span>?</span>{unknown}</li>)}</ul></section></div>
      <section className="official-handoff"><div><p className="eyebrow">Official handoff</p><h2>Continue outside Scholarship Guardian.</h2><p>The government or scheme portal remains the system of record. Verify the current cycle, deadline, institution status, and required documents before submitting.</p><dl><div><dt>Application system</dt><dd>{scholarship.portal}</dd></div><div><dt>Dataset reference</dt><dd>{officialSource?.title ?? 'Official source must be confirmed'}</dd></div></dl></div>{officialSource && <a className="button button-primary" href={officialSource.url} target="_blank" rel="noreferrer">Continue to official application <span aria-hidden="true">↗</span></a>}</section>
      <p className="handoff-note">Guardian does not submit, approve, or guarantee the scholarship. The official portal remains the system of record. This link comes from the prototype dataset.</p>
    </section></main>
  );
}
