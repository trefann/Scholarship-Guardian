'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { evaluateApplication } from '@/app/lib/application-evaluator';
import { documentTypeLabel, formatValue } from '@/app/lib/rules-engine';
import type { ScholarshipDataset } from '@/app/lib/types';
import { AppHeader } from './app-header';
import { EvidenceChain } from './evidence-chain';
import { StatusBadge } from './status-badge';

const dataset = source as ScholarshipDataset;

export function IssueView({ findingId, scholarshipId }: { findingId: string; scholarshipId: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === scholarshipId);
  const { profile, evidenceDocuments, reviewStates, reviewStateHydrated, updateReviewState } = useAppState();
  const router = useRouter();
  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Issue not found</h1></section></main>;
  if (!reviewStateHydrated) return <main><AppHeader step="xray" /><section className="issue-page"><div className="review-loading" role="status">Loading your saved demo review…</div></section></main>;
  const review = reviewStates[scholarshipId];
  const resolved = review?.resolvedFindingIds ?? [];
  const pending = review?.pendingResolvedFindingIds ?? [];
  const report = evaluateApplication(scholarship, profile, evidenceDocuments, resolved);
  const finding = report.findings.find((item) => item.id === findingId);
  if (!finding) return <main><AppHeader /><section className="inner-page"><h1>Issue not found</h1><Link href={`/xray/${scholarshipId}`}>Back to X-Ray</Link></section></main>;
  const isPending = pending.includes(findingId);
  const isResolved = resolved.includes(findingId);
  const nameValues = finding.evidenceChain.documents.map((document) => ({ document: documentTypeLabel(document.type), value: formatValue(document.name) }));
  const distinctNameValues = [...new Set(nameValues.map((item) => item.value))];

  function markResolved() {
    updateReviewState(scholarshipId, { pendingResolvedFindingIds: [...new Set([...pending, findingId])] });
  }
  function keepUnresolved() {
    updateReviewState(scholarshipId, { pendingResolvedFindingIds: pending.filter((id) => id !== findingId), resolvedFindingIds: resolved.filter((id) => id !== findingId) });
  }
  function rerun() {
    updateReviewState(scholarshipId, { resolvedFindingIds: [...new Set([...resolved, ...pending, findingId])], pendingResolvedFindingIds: [], xrayRunCount: (review?.xrayRunCount ?? 0) + 1 });
    router.push(`/xray/${scholarshipId}`);
  }

  return (
    <main><AppHeader step="xray" /><section className="issue-page">
      <Link className="back-link" href={`/xray/${scholarshipId}`}>← Application X-Ray</Link>
      <div className="issue-layout"><section className="issue-main"><div className="issue-heading"><p className="eyebrow">Focused issue review</p><h1>{finding.title}</h1><p>Guardian found different structured values across synthetic documents. This may require clarification; it does not prove rejection or ineligibility.</p></div>
        <div className="issue-block"><span>What we found</span><strong className="mismatch-value">{distinctNameValues.join(' ≠ ')}</strong><div className="compared-values">{nameValues.map((item) => <div key={item.document}><span>{item.document}</span><strong>{item.value}</strong></div>)}</div></div>
        <div className="issue-explanation-grid"><div><span>Why it matters</span><p>{finding.explanation}</p></div><div><span>What you can do</span><p>{finding.recommendedAction}</p></div><div><span>Status</span><StatusBadge status={isResolved ? 'REVIEWED' : 'ATTENTION'} /><p>{isResolved ? 'Reviewed by you. Underlying records remain unchanged and unverified.' : isPending ? 'Marked by you; waiting for an X-Ray recheck.' : 'Needs attention before readiness can improve.'}</p></div></div>
        <EvidenceChain chain={finding.evidenceChain} />
      </section>
      <aside className="resolution-panel"><p className="eyebrow">What to do next</p><h2>{isResolved ? 'Reviewed by you.' : isPending ? 'Ready to recheck.' : 'Check your authoritative records.'}</h2><p>{isResolved ? 'Guardian records only that you reviewed this issue. It did not change either document.' : isPending ? 'Re-run X-Ray to recompute all findings using your review action.' : 'Confirm the correct name using authoritative identity or admission records. Then record that review here.'}</p><div className="resolution-actions">{!isResolved && !isPending && <button className="button button-primary" type="button" onClick={markResolved}>I’ve reviewed this</button>}{(isPending || isResolved) && <button className="button button-secondary" type="button" onClick={keepUnresolved}>Keep this open</button>}{isPending && <button className="button button-primary" type="button" onClick={rerun}>Re-run X-Ray <span aria-hidden="true">→</span></button>}{isResolved && <Link className="button button-primary" href={`/xray/${scholarshipId}`}>Return to X-Ray <span aria-hidden="true">→</span></Link>}</div><small>Review is a user action. Guardian does not claim any government or institutional record has changed.</small></aside></div>
    </section></main>
  );
}
