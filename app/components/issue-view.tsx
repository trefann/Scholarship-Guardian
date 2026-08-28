'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { evaluateApplication } from '@/app/lib/application-evaluator';
import { requestApplicationEvaluation } from '@/app/lib/evaluation-client';
import { documentTypeLabel, formatValue } from '@/app/lib/rules-engine';
import type { ScholarshipDataset } from '@/app/lib/types';
import { AppHeader } from './app-header';
import { EvidenceChain } from './evidence-chain';
import { StatusBadge } from './status-badge';

const dataset = source as ScholarshipDataset;

export function IssueView({ findingId, scholarshipId }: { findingId: string; scholarshipId: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === scholarshipId);
  const {
    profile,
    evidenceDocuments,
    reviewStates,
    reviewStateHydrated,
    updateEvidenceDocument,
    updateReviewState,
  } = useAppState();
  const router = useRouter();

  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Issue not found</h1></section></main>;
  if (!reviewStateHydrated) return <main><AppHeader step="xray" scholarshipId={scholarshipId} /><section className="issue-page"><div className="review-loading" role="status">Loading your saved demo review…</div></section></main>;

  const review = reviewStates[scholarshipId];
  const reviewedFindingIds = review?.reviewedFindingIds ?? [];
  const report = evaluateApplication(scholarship, profile, evidenceDocuments, reviewedFindingIds);
  const finding = report.findings.find((item) => item.id === findingId);
  if (!finding) return <main><AppHeader /><section className="inner-page"><h1>Issue not found</h1><Link href={`/xray/${scholarshipId}`}>Back to X-Ray</Link></section></main>;

  const isReviewed = reviewedFindingIds.includes(findingId);
  const nameValues = finding.evidenceChain.documents.map((document) => ({
    document: documentTypeLabel(document.type),
    value: formatValue(document.name),
  }));
  const distinctNameValues = [...new Set(nameValues.map((item) => item.value))];
  const hasMismatch = distinctNameValues.length > 1;
  const resolutionState = hasMismatch ? isReviewed ? 'reviewed' : 'open' : 'corrected';

  function markReviewed() {
    updateReviewState(scholarshipId, {
      reviewedFindingIds: [...new Set([...reviewedFindingIds, findingId])],
    });
  }

  function markNotReviewed() {
    updateReviewState(scholarshipId, {
      reviewedFindingIds: reviewedFindingIds.filter((id) => id !== findingId),
    });
  }

  async function applyDemoCorrection() {
    const admissionProof = evidenceDocuments.find((document) => document.type === 'ADMISSION_PROOF');
    if (!admissionProof) return;
    const correctedEvidence = evidenceDocuments.map((document) => document.id === admissionProof.id ? { ...document, name: profile.name } : document);
    await requestApplicationEvaluation({ scholarshipId, profile, evidenceDocuments: correctedEvidence, reviewedFindingIds });
    updateEvidenceDocument(admissionProof.id, { name: profile.name });
    updateReviewState(scholarshipId, { xrayRunCount: (review?.xrayRunCount ?? 0) + 1 });
    router.push(`/xray/${scholarshipId}`);
  }

  return (
    <main>
      <AppHeader step="xray" scholarshipId={scholarshipId} />
      <section className="issue-page">
        <Link className="back-link" href={`/xray/${scholarshipId}`}>← Application X-Ray</Link>
        <div className="issue-layout">
          <section className="issue-main">
            <div className="issue-heading">
              <p className="eyebrow">Focused issue review</p>
              <h1>{finding.title}</h1>
              <p>Guardian compares structured values across synthetic documents. A mismatch may require clarification; it does not prove rejection or ineligibility.</p>
            </div>
            <div className="issue-block">
              <span>{hasMismatch ? 'What we found' : 'After the demo correction'}</span>
              <strong className="mismatch-value">{distinctNameValues.join(hasMismatch ? ' ≠ ' : ' = ')}</strong>
              <div className="compared-values">
                {nameValues.map((item) => <div key={item.document}><span>{item.document}</span><strong>{item.value}</strong></div>)}
              </div>
            </div>
            <div className="issue-explanation-grid">
              <div><span>Why it matters</span><p>{finding.explanation}</p></div>
              <div><span>What you can do</span><p>{finding.recommendedAction}</p></div>
              <div><span>Status</span><StatusBadge status={finding.status} /><p>{hasMismatch ? isReviewed ? 'Reviewed by you, but the mismatch still blocks readiness.' : 'Needs attention before readiness can improve.' : 'The structured synthetic values now agree. This is not identity verification.'}</p></div>
            </div>
            <EvidenceChain chain={finding.evidenceChain} />
          </section>

          <aside className="resolution-panel">
            <p className="eyebrow">What to do next</p>
            <div className="resolution-state" key={resolutionState}>
              <div className="resolution-copy" aria-live="polite" aria-atomic="true">
                <h2>{hasMismatch ? isReviewed ? 'Reviewed—not resolved.' : 'Check your authoritative records.' : 'Demo evidence corrected.'}</h2>
                <p>{hasMismatch ? isReviewed ? 'Guardian recorded your review, but readiness stays blocked until the evidence changes.' : 'Confirm the correct name using authoritative identity or admission records. Then record that review here.' : 'The synthetic Admission Proof now uses the same name as the other demo documents.'}</p>
              </div>
              <div className="resolution-actions">
                {hasMismatch && !isReviewed && <button className="button button-primary" type="button" onClick={markReviewed}>I’ve reviewed this</button>}
                {hasMismatch && isReviewed && <button className="button button-secondary" type="button" onClick={markNotReviewed}>Mark as not reviewed</button>}
                {hasMismatch && isReviewed && <button className="button button-primary" type="button" onClick={applyDemoCorrection}>Apply corrected demo evidence <span aria-hidden="true">→</span></button>}
                {!hasMismatch && <Link className="button button-primary" href={`/xray/${scholarshipId}`}>Return to X-Ray <span aria-hidden="true">→</span></Link>}
              </div>
            </div>
            <small>The correction changes only preloaded synthetic evidence. Guardian does not claim any government or institutional record has changed.</small>
          </aside>
        </div>
      </section>
    </main>
  );
}
