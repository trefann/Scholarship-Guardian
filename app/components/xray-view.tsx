'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { evaluateApplication } from '@/app/lib/application-evaluator';
import { requestApplicationEvaluation } from '@/app/lib/evaluation-client';
import type { FindingStatus, ScholarshipDataset, XRayFinding } from '@/app/lib/types';
import { AppHeader } from './app-header';
import { EvidenceChain } from './evidence-chain';
import { StatusBadge } from './status-badge';

const dataset = source as ScholarshipDataset;
const categoryLabels = { ELIGIBILITY: 'Eligibility', EVIDENCE: 'Evidence', DOCUMENT_CONSISTENCY: 'Document consistency', AUTHORITY_DEPENDENT: 'Authority-dependent check' } as const;

export function XRayView({ id }: { id: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === id);
  const { profile, evidenceDocuments, reviewStates, reviewStateHydrated, updateReviewState } = useAppState();
  const [showRechecked, setShowRechecked] = useState(false);
  const recheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (recheckTimer.current) clearTimeout(recheckTimer.current);
  }, []);
  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Scholarship not found</h1></section></main>;
  if (!reviewStateHydrated) return <main><AppHeader step="xray" scholarshipId={id} /><section className="xray-page"><div className="review-loading" role="status">Loading your saved demo review…</div></section></main>;
  const review = reviewStates[id];
  const reviewedFindingIds = review?.reviewedFindingIds ?? [];
  const report = evaluateApplication(scholarship, profile, evidenceDocuments, reviewedFindingIds);
  const beforeCorrection = evaluateApplication(scholarship, profile, dataset.demo_documents, []);
  const evidenceChanged = JSON.stringify(evidenceDocuments) !== JSON.stringify(dataset.demo_documents);
  const passed = report.findings.filter((finding) => finding.status === 'PASS');
  const reviewed = report.findings.filter((finding) => finding.status === 'REVIEWED');
  const needsAction = report.unresolvedPreventable.filter((finding) => finding.status !== 'REVIEWED');
  const idleRecheckLabel = 'Recheck application';

  async function recheck() {
    await requestApplicationEvaluation({ scholarshipId: id, profile, evidenceDocuments, reviewedFindingIds });
    updateReviewState(id, { xrayRunCount: (review?.xrayRunCount ?? 0) + 1 });
    setShowRechecked(true);
    if (recheckTimer.current) clearTimeout(recheckTimer.current);
    recheckTimer.current = setTimeout(() => setShowRechecked(false), 1600);
  }

  return (
    <main><AppHeader step="xray" scholarshipId={id} /><section className="xray-page">
      <Link className="back-link" href={`/preparation/${id}`}>← Preparation</Link>
      <section className={`xray-summary ${report.readiness === 'READY_TO_APPLY' ? 'summary-ready' : ''}`} aria-labelledby="xray-heading">
        <div className="xray-summary-copy"><p className="eyebrow">Application X-Ray</p><h1 id="xray-heading">{report.readiness === 'READY_TO_APPLY' ? 'Ready to continue' : 'Almost ready'}</h1><p>{report.readiness === 'READY_TO_APPLY' ? 'Guardian found no known preventable blocker.' : `${report.unresolvedPreventable.length} preventable finding still needs correction or clarification.`} Results use Arun’s synthetic profile, prototype rules, and structured demo evidence—not an eligibility score or approval prediction.</p></div>
        <div className="xray-counts" aria-label="Current X-Ray result counts"><XRayCount status="PASS" count={report.counts.PASS} label="passed" /><XRayCount status="REVIEWED" count={report.counts.REVIEWED} label="reviewed by you" /><XRayCount status="ATTENTION" count={report.counts.ATTENTION} label="need attention" /><XRayCount status="BLOCKED" count={report.counts.BLOCKED} label="blocked" /><XRayCount status="UNKNOWN" count={report.counts.UNKNOWN} label="cannot be determined" /></div>
        <div className="xray-summary-actions"><div><strong>Guardian readiness</strong><span>{report.readiness === 'READY_TO_APPLY' ? 'Ready to continue' : `${report.unresolvedPreventable.length} preventable issue${report.unresolvedPreventable.length === 1 ? ' remains' : 's remain'}`}</span></div><button className="button button-light recheck-button" data-rechecked={showRechecked} type="button" onClick={recheck} aria-label={showRechecked ? 'Application rechecked' : idleRecheckLabel}><span className="recheck-label" aria-hidden="true"><span className="recheck-label-text" data-visible={!showRechecked}>{idleRecheckLabel}</span><span className="recheck-label-text" data-visible={showRechecked}>Rechecked</span></span><span aria-hidden="true">{showRechecked ? '✓' : '↻'}</span></button><span className="sr-only" role="status" aria-live="polite">{showRechecked ? 'Application rechecked. Findings are current.' : ''}</span></div>
      </section>

      {reviewed.length > 0 && <div className="pending-recheck" role="status"><strong>{reviewed.length} issue reviewed—not resolved.</strong><span>Review alone does not clear readiness. Correct or clarify the evidence before continuing.</span></div>}
      {evidenceChanged && (review?.xrayRunCount ?? 0) > 0 && <section className="xray-transition" aria-label="X-Ray result change" role="status"><div><span>Before correction</span><strong>{beforeCorrection.counts.ATTENTION}</strong><small>needed attention</small></div><span className="transition-arrow" aria-hidden="true">→</span><div><span>After recheck</span><strong>{report.counts.ATTENTION}</strong><small>needs attention</small></div><div className="transition-reviewed"><strong>{report.counts.PASS}</strong><small>supported checks</small></div><p>Guardian recalculated every finding after the synthetic evidence changed. No government or institutional record was updated.</p></section>}

      <section className="actionability-grid" aria-label="Preventable and authority-dependent findings"><div className="can-fix"><p className="eyebrow">You can fix before applying</p>{report.unresolvedPreventable.length ? <ul>{report.unresolvedPreventable.map((finding) => <li key={finding.id}><span aria-hidden="true">!</span><div><strong>{finding.title}</strong><small>{finding.recommendedAction}</small>{finding.category === 'DOCUMENT_CONSISTENCY' && <Link href={`/issue/${finding.id}?scholarship=${id}`}>Review finding →</Link>}</div></li>)}</ul> : <p className="empty-action-state">✓ No known preventable findings remain.</p>}</div><div className="cannot-control"><p className="eyebrow">Only the authority can decide</p><ul>{report.authorityDependent.map((finding) => <li key={finding.id}><span aria-hidden="true">?</span><div><strong>{finding.title}</strong><small>{finding.recommendedAction}</small><a href={`#finding-${finding.id.replace(/[^a-z0-9_-]/gi, '-')}`}>View assessment ↓</a></div></li>)}</ul></div></section>

      <FindingGroup title="You can fix before applying" description="Preventable findings to correct or clarify before the official application." findings={needsAction} scholarshipId={id} />
      <FindingGroup title="Reviewed by you—still unresolved" description="These issues remain readiness blockers until the evidence is corrected or authoritatively clarified." findings={reviewed} scholarshipId={id} />
      <FindingGroup title="Only the authority can decide" description="Authority-dependent ATTENTION and UNKNOWN results are not application errors or failures." findings={report.authorityDependent} scholarshipId={id} />
      <FindingGroup title="Supported by your evidence" description="PASS checks supported by the available profile information and structured demo evidence." findings={passed} scholarshipId={id} />

      <section className={`xray-readiness ${report.readiness === 'READY_TO_APPLY' ? 'is-ready' : ''}`}><div><p className="eyebrow">Application readiness</p><h2>{report.readiness === 'READY_TO_APPLY' ? 'Ready to continue' : 'Not ready yet'}</h2>{report.readiness === 'READY_TO_APPLY' ? <p>No known preventable document issue remains. Authority verification, final selection, sanction, and payment remain outside Guardian’s control.</p> : <p>Resolve the preventable findings above before continuing. Guardian will not mark this ready merely because a button was clicked.</p>}</div>{report.readiness === 'READY_TO_APPLY' ? <Link className="button button-primary" href={`/ready/${id}`}>View official handoff <span aria-hidden="true">→</span></Link> : report.unresolvedPreventable[0]?.category === 'DOCUMENT_CONSISTENCY' ? <Link className="button button-primary" href={`/issue/${report.unresolvedPreventable[0].id}?scholarship=${id}`}>Review issue <span aria-hidden="true">→</span></Link> : <a className="button button-secondary" href="#things-requiring-action">Review issues ↑</a>}</section>
    </section></main>
  );
}

function XRayCount({ status, count, label }: { status: FindingStatus; count: number; label: string }) {
  return <div className={`xray-count count-${status.toLowerCase()}`}><span aria-hidden="true">{status === 'PASS' ? '✓' : status === 'REVIEWED' ? '↺' : status === 'UNKNOWN' ? '?' : status === 'BLOCKED' ? '×' : '!'}</span><strong>{count}</strong><small>{label}</small></div>;
}

function FindingGroup({ title, description, findings, scholarshipId }: { title: string; description: string; findings: XRayFinding[]; scholarshipId: string }) {
  const sectionId = title === 'You can fix before applying' ? 'things-requiring-action' : undefined;
  if (!findings.length) return null;
  return <section className="finding-group" id={sectionId}><div className="finding-group-heading"><h2>{title}</h2><p>{description}</p></div><div className="xray-findings">{findings.map((finding) => <XRayFindingCard key={finding.id} finding={finding} scholarshipId={scholarshipId} />)}</div></section>;
}

function XRayFindingCard({ finding, scholarshipId }: { finding: XRayFinding; scholarshipId: string }) {
  return <details className={`xray-finding finding-${finding.status.toLowerCase()}`} id={`finding-${finding.id.replace(/[^a-z0-9_-]/gi, '-')}`} open={finding.status !== 'PASS'}><summary className="finding-topline"><div><span className="finding-category">{categoryLabels[finding.category]}</span><h3>{finding.title}</h3></div><div className="finding-status"><StatusBadge status={finding.status} />{finding.reviewedByUser && <span className="reviewed-badge">Reviewed—not resolved</span>}<span className="finding-disclosure" aria-hidden="true">⌄</span></div></summary><div className="finding-body"><div className="finding-details"><div><span>Official requirement</span><strong>{finding.requirement}</strong></div><div><span>Based on your information</span><strong>{finding.studentValue}</strong></div><div><span>Evidence</span><p>{finding.evidenceSummary}</p></div><div><span>Guardian assessment</span><p>{finding.explanation}</p></div><div><span>Recommended action</span><p>{finding.recommendedAction}</p></div><div><span>Confidence / uncertainty</span><p>{finding.confidenceLabel}</p></div></div><div className="finding-context"><span>Source / context</span><p>{finding.sourceContext}</p><Link href={`/documents/${scholarshipId}`}>View evidence →</Link></div>{finding.category === 'DOCUMENT_CONSISTENCY' && finding.status !== 'PASS' && <div className="finding-issue-action"><Link className="button button-primary" href={`/issue/${finding.id}?scholarship=${scholarshipId}`}>Fix issue <span aria-hidden="true">→</span></Link></div>}<EvidenceChain chain={finding.evidenceChain} /></div></details>;
}
