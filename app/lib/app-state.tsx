'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import source from '@/app/data/scholarships.json';
import type { ApplicationReviewState, EvidenceDocument, ScholarshipDataset, StudentProfile } from './types';

const dataset = source as ScholarshipDataset;
const demoProfile: StudentProfile = { ...dataset.demo_student };
const demoEvidence: EvidenceDocument[] = dataset.demo_documents.map((document) => ({ ...document }));
const REVIEW_STORAGE_KEY = 'scholarship-guardian-resolution-actions';

type AppStateValue = {
  profile: StudentProfile;
  setProfile: (profile: StudentProfile) => void;
  resetToDemo: () => void;
  evidenceDocuments: EvidenceDocument[];
  reviewStates: Record<string, ApplicationReviewState>;
  reviewStateHydrated: boolean;
  updateReviewState: (scholarshipId: string, update: Partial<Omit<ApplicationReviewState, 'scholarshipId'>>) => void;
};

const AppState = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile>(demoProfile);
  const [reviewStates, setReviewStates] = useState<Record<string, ApplicationReviewState>>({});
  const [reviewStateHydrated, setReviewStateHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REVIEW_STORAGE_KEY);
      if (saved) {
        const actions = JSON.parse(saved) as Record<string, { resolvedFindingIds?: string[]; pendingResolvedFindingIds?: string[] }>;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Client-only hydration from persisted review actions is intentional.
        setReviewStates(Object.fromEntries(Object.entries(actions).map(([scholarshipId, action]) => [scholarshipId, {
          scholarshipId,
          resolvedFindingIds: action.resolvedFindingIds ?? [],
          pendingResolvedFindingIds: action.pendingResolvedFindingIds ?? [],
          xrayRunCount: 0,
        }])));
      }
    } catch {
      // Ignore malformed local prototype state and continue with a clean review.
    } finally {
      setReviewStateHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!reviewStateHydrated) return;
    const resolutionActions = Object.fromEntries(Object.entries(reviewStates).map(([scholarshipId, review]) => [scholarshipId, {
      resolvedFindingIds: review.resolvedFindingIds,
      pendingResolvedFindingIds: review.pendingResolvedFindingIds,
    }]));
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(resolutionActions));
  }, [reviewStates, reviewStateHydrated]);
  const value = useMemo(() => ({
    profile,
    setProfile,
    resetToDemo: () => setProfile({ ...demoProfile }),
    evidenceDocuments: demoEvidence,
    reviewStates,
    reviewStateHydrated,
    updateReviewState: (scholarshipId: string, update: Partial<Omit<ApplicationReviewState, 'scholarshipId'>>) => {
      setReviewStates((current) => ({
        ...current,
        [scholarshipId]: {
          scholarshipId,
          resolvedFindingIds: [],
          pendingResolvedFindingIds: [],
          xrayRunCount: 0,
          ...current[scholarshipId],
          ...update,
        },
      }));
    },
  }), [profile, reviewStates, reviewStateHydrated]);
  return <AppState.Provider value={value}>{children}</AppState.Provider>;
}

export function useAppState() {
  const value = useContext(AppState);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
