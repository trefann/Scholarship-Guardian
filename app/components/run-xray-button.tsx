'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/lib/app-state';
import { requestApplicationEvaluation } from '@/app/lib/evaluation-client';

export function RunXRayButton({ scholarshipId, label = 'Run Application X-Ray', className = 'button button-primary' }: { scholarshipId: string; label?: string; className?: string }) {
  const router = useRouter();
  const { profile, evidenceDocuments, reviewStates, updateReviewState } = useAppState();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    const review = reviewStates[scholarshipId];
    setIsRunning(true);
    setError('');
    try {
      await requestApplicationEvaluation({
        scholarshipId,
        profile,
        evidenceDocuments,
        reviewedFindingIds: review?.reviewedFindingIds ?? [],
      });
      updateReviewState(scholarshipId, { xrayRunCount: (review?.xrayRunCount ?? 0) + 1 });
      router.push(`/xray/${scholarshipId}`);
    } catch {
      setError('X-Ray could not run. Please try again.');
      setIsRunning(false);
    }
  }

  return <div className="run-xray-control"><button className={className} type="button" onClick={run} disabled={isRunning}>{isRunning ? 'Running X-Ray…' : label} {!isRunning && <span aria-hidden="true">→</span>}</button>{error && <span className="control-error" role="alert">{error}</span>}</div>;
}
