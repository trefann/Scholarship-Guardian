'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/lib/app-state';

export function RunXRayButton({ scholarshipId, label = 'Run Application X-Ray', className = 'button button-primary' }: { scholarshipId: string; label?: string; className?: string }) {
  const router = useRouter();
  const { reviewStates, updateReviewState } = useAppState();
  function run() {
    const review = reviewStates[scholarshipId];
    updateReviewState(scholarshipId, { xrayRunCount: (review?.xrayRunCount ?? 0) + 1 });
    router.push(`/xray/${scholarshipId}`);
  }
  return <button className={className} type="button" onClick={run}>{label} <span aria-hidden="true">→</span></button>;
}
