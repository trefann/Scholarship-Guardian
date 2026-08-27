'use client';

import Link from 'next/link';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { evaluateApplication } from '@/app/lib/application-evaluator';
import type { FindingStatus, ScholarshipDataset, XRayFinding } from '@/app/lib/types';
import { AppHeader } from './app-header';
import { EvidenceChain } from './evidence-chain';
import { StatusBadge } from './status-badge';

const dataset = source as ScholarshipDataset;
const categoryLabels = { ELIGIBILITY: 'Eligibility', EVIDENCE: 'Evidence', DOCUMENT_CONSISTENCY: 'Document consistency', AUTHORITY_DEPENDENT: 'Authority-dependent check' } as const;

export function XRayView({ id }: { id: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === id);
  const { profile, evidenceDocuments, reviewStates, reviewStateHydrated, updateReviewState } = useAppState();
  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Scholarship not found</h1></section></main>;
  if (!reviewStateHydrated) return <main><AppHeader step="xray" /><section className="xray-page"><div className="review-loading" role="status">Loading your saved demo review…</div></section></main>;
  const review = reviewStates[id];
  const resolvedFindingIds = review?.resolvedFindingIds ?? [];
  const pendingResolvedFindingIds = review?.pendingResolvedFindingIds ?? [];
  const report = evaluateApplication(scholarship, profile, evidenceDocuments, resolvedFindingIds);
  const beforeResolution = evaluateApplication(scholarship, profile, evidenceDocuments, []);
  const passed = report.findings.filter((finding) => finding.status === 'PASS');
  const reviewed = report.findings.filter((finding) => finding.status === 'REVIEWED');

  function recheck() {
    const applied = [...new Set([...resolvedFindingIds, ...pendingResolvedFindingIds])];
    updateReviewState(id, { resolvedFindingIds: applied, pendingResolvedFindingIds: [], xrayRunCount: (review?.xrayRunCount ?? 0) + 1 });
  }

  return (
    <main><AppHeader step="xray" /><section className="xray-page">
      <Link className="back-link" href={`/preparation/${id}`}>← Preparation</Link>
      <section className={`xray-summary ${report.readiness === 'READY_TO_APPLY' ? 'summary-ready' : ''}`} aria-labelledby="xray-heading">
        <div className="xray-summary-copy"><p className="eyebrow">Application X-Ray</p><h1 id="xray-heading">{report.readiness === 'READY_TO_APPLY' ? 'Ready to continue' : 'Almost ready'}</h1><p>{report.readiness === 'READY_TO_APPLY' ? 'Guardian found no known preventable blocker.' : `${report.unresolvedPreventable.length} preventable finding still needs your review.`} Results use Arun’s synthetic profile, prototype rules, and structured demo evidence—not an eligibility score or approval prediction.</p></div>
        <div className="xray-counts" aria-label="Current X-Ray result counts"><XRayCount status="PASS" count={report.counts.PASS} label="passed" /><XRayCount status="REVIEWED" count={report.counts.REVIEWED} label="reviewed by you" /><XRayCount status="ATTENTION" count={report.counts.ATTENTION} label="need attention" /><XRayCount status="BLOCKED" count={report.counts.BLOCKED} label="blocked" /><XRayCount status="UNKNOWN" count={report.counts.UNKNOWN} label="cannot be determined" /></div>
        <div className="xray-summary-actions"><div><strong>Guardian readiness</strong><span>{report.readiness === 'READY_TO_APPLY' ? 'Ready to continue' : `${report.unresolvedPreventable.length} preventable issue${report.unresolvedPreventable.length === 1 ? ' remains' : 's remain'}`}</span></div><button className="button button-light" type="button" onClick={recheck}>{pendingResolvedFindingIds.length ? 'Re-run X-Ray' : 'Recheck application'} <span aria-hidden="true">↻</span></button></div>
      </section>

      {pendingResolvedFindingIds.length > 0 && <div className="pending-recheck" role="status"><strong>{pendingResolvedFindingIds.length} resolution action waiting.</strong><span>Re-run X-Ray to apply it and recompute every finding.</span></div>}
      {resolvedFindingIds.length > 0 && (review?.xrayRunCount ?? 0) > 0 && <section className="xray-transition" aria-label="X-Ray result change" role="status"><div><span>Before review</span><strong>{beforeResolution.counts.ATTENTION}</strong><small>needed attention</small></div><span className="transition-arrow" aria-hidden="true">→</span><div><span>After recheck</span><strong>{report.counts.ATTENTION}</strong><small>needs attention</small></div><div className="transition-reviewed"><strong>{report.counts.REVIEWED}</strong><small>reviewed by you</small></div><p>Guardian recalculated every finding. Your review changed the workflow state; the underlying demo documents remain unchanged and unverified.</p></section>}

      <section className="actionability-grid" aria-label="Preventable and authority-dependent findings"><div className="can-fix"><p className="eyebrow">You can fix before applying</p>{report.unresolvedPreventable.length ? <ul>{report.unresolvedPreventable.map((finding) => <li key={finding.id}><span aria-hidden="true">!</span><div><strong>{finding.title}</strong><small>{finding.recommendedAction}</small>{finding.category === 'DOCUMENT_CONSISTENCY' && <Link href={`/issue/${finding.id}?scholarship=${id}`}>Review finding →</Link>}</div></li>)}</ul> : <p className="empty-action-state">✓ No known preventable findings remain.</p>}</div><div className="cannot-control"><p className="eyebrow">Only the authority can decide</p><ul>{report.authorityDependent.map((finding) => <li key={finding.id}><span aria-hidden="true">?</span><div><strong>{finding.title}</strong><small>{finding.recommendedAction}</small><a href={`#finding-${finding.id.replace(/[^a-z0-9_-]/gi, '-')}`}>View assessment ↓</a></div></li>)}</ul></div></section>

      <FindingGroup title="You can fix before applying" description="Preventable findings to review before the official application." findings={report.unresolvedPreventable} scholarshipId={id} empty="No unresolved preventable findings." />
      <FindingGroup title="Supported by your evidence" description="PASS checks supported by the available profile information and structured demo evidence." findings={passed} scholarshipId={id} />
      <FindingGroup title="Reviewed by you" description="User-reviewed issues that no longer block readiness; the underlying evidence has not been verified or changed." findings={reviewed} scholarshipId={id} />
      <FindingGroup title="Only the authority can decide" description="Authority-dependent ATTENTION and UNKNOWN results are not application errors or failures." findings={report.authorityDependent} scholarshipId={id} />

      <section className={`xray-readiness ${report.readiness === 'READY_TO_APPLY' ? 'is-ready' : ''}`}><div><p className="eyebrow">Application readiness</p><h2>{report.readiness === 'READY_TO_APPLY' ? 'Ready to continue' : 'Not ready yet'}</h2>{report.readiness === 'READY_TO_APPLY' ? <p>No known preventable document issue remains. Authority verification, final selection, sanction, and payment remain outside Guardian’s control.</p> : <p>Resolve the preventable findings above before continuing. Guardian will not mark this ready merely because a button was clicked.</p>}</div>{report.readiness === 'READY_TO_APPLY' ? <Link className="button button-primary" href={`/ready/${id}`}>View official handoff <span aria-hidden="true">→</span></Link> : report.unresolvedPreventable[0]?.category === 'DOCUMENT_CONSISTENCY' ? <Link className="button button-primary" href={`/issue/${report.unresolvedPreventable[0].id}?scholarship=${id}`}>Review issue <span aria-hidden="true">→</span></Link> : <a className="button button-secondary" href="#things-requiring-action">Review issues ↑</a>}</section>
    </section></main>
  );
}

function XRayCount({ status, count, label }: { status: FindingStatus; count: number; label: string }) {
  return <div className={`xray-count count-${status.toLowerCase()}`}><span aria-hidden="true">{status === 'PASS' || status === 'REVIEWED' ? '✓' : status === 'UNKNOWN' ? '?' : status === 'BLOCKED' ? '×' : '!'}</span><strong>{count}</strong><small>{label}</small></div>;
}

function FindingGroup({ title, description, findings, scholarshipId, empty }: { title: string; description: string; findings: XRayFinding[]; scholarshipId: string; empty?: string }) {
  const sectionId = title === 'You can fix before applying' ? 'things-requiring-action' : undefined;
  if (!findings.length && !empty) return null;
  return <section className="finding-group" id={sectionId}><div className="finding-group-heading"><h2>{title}</h2><p>{description}</p></div>{findings.length ? <div className="xray-findings">{findings.map((finding) => <XRayFindingCard key={finding.id} finding={finding} scholarshipId={scholarshipId} />)}</div> : <p className="finding-empty">✓ {empty}</p>}</section>;
}

function XRayFindingCard({ finding, scholarshipId }: { finding: XRayFinding; scholarshipId: string }) {
  return <article className={`xray-finding finding-${finding.status.toLowerCase()}`} id={`finding-${finding.id.replace(/[^a-z0-9_-]/gi, '-')}`}><div className="finding-topline"><div><span className="finding-category">{categoryLabels[finding.category]}</span><h3>{finding.title}</h3></div><div className="finding-status"><StatusBadge status={finding.status} />{finding.resolvedByUser && <span className="reviewed-badge">Reviewed by you</span>}</div></div><div className="finding-details"><div><span>Official requirement</span><strong>{finding.requirement}</strong></div><div><span>Based on your information</span><strong>{finding.studentValue}</strong></div><div><span>Evidence</span><p>{finding.evidenceSummary}</p></div><div><span>Guardian assessment</span><p>{finding.explanation}</p></div><div><span>Recommended action</span><p>{finding.recommendedAction}</p></div><div><span>Confidence / uncertainty</span><p>{finding.confidenceLabel}</p></div></div><div className="finding-context"><span>Source / context</span><p>{finding.sourceContext}</p><Link href={`/documents/${scholarshipId}`}>View evidence →</Link></div>{finding.category === 'DOCUMENT_CONSISTENCY' && <div className="finding-issue-action"><Link className="button button-secondary" href={`/issue/${finding.id}?scholarship=${scholarshipId}`}>{finding.resolvedByUser ? 'Review resolution' : 'Review issue'} <span aria-hidden="true">→</span></Link></div>}<EvidenceChain chain={finding.evidenceChain} /></article>;
}
