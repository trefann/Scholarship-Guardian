'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import source from '@/app/data/scholarships.json';
import type { ApplicationReviewState, EvidenceDocument, ScholarshipDataset, StudentProfile } from './types';

const dataset = source as ScholarshipDataset;
const demoProfile: StudentProfile = { ...dataset.demo_student };
const demoEvidence: EvidenceDocument[] = dataset.demo_documents.map((document) => ({ ...document }));
const SESSION_STORAGE_KEY = 'scholarship-guardian-demo-session-v2';
const LEGACY_REVIEW_STORAGE_KEY = 'scholarship-guardian-resolution-actions';

type DemoSession = {
  profile: StudentProfile;
  evidenceDocuments: EvidenceDocument[];
  reviewStates: Record<string, ApplicationReviewState>;
};

function freshDemoSession(): DemoSession {
  return {
    profile: { ...demoProfile },
    evidenceDocuments: demoEvidence.map((document) => ({ ...document })),
    reviewStates: {},
  };
}

type AppStateValue = {
  profile: StudentProfile;
  setProfile: (profile: StudentProfile) => void;
  resetToDemo: () => void;
  evidenceDocuments: EvidenceDocument[];
  updateEvidenceDocument: (documentId: string, update: Partial<EvidenceDocument>) => void;
  reviewStates: Record<string, ApplicationReviewState>;
  reviewStateHydrated: boolean;
  updateReviewState: (scholarshipId: string, update: Partial<Omit<ApplicationReviewState, 'scholarshipId'>>) => void;
};

const AppState = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DemoSession>(freshDemoSession);
  const [reviewStateHydrated, setReviewStateHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DemoSession;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Client-only hydration from persisted demo state is intentional.
        setSession({
          profile: parsed.profile ?? { ...demoProfile },
          evidenceDocuments: parsed.evidenceDocuments ?? demoEvidence.map((document) => ({ ...document })),
          reviewStates: parsed.reviewStates ?? {},
        });
      } else {
        const legacySaved = window.localStorage.getItem(LEGACY_REVIEW_STORAGE_KEY);
        if (legacySaved) {
          const legacyActions = JSON.parse(legacySaved) as Record<string, { resolvedFindingIds?: string[]; pendingResolvedFindingIds?: string[] }>;
          const reviewStates = Object.fromEntries(Object.entries(legacyActions).map(([scholarshipId, action]) => [scholarshipId, {
            scholarshipId,
            reviewedFindingIds: [...new Set([...(action.resolvedFindingIds ?? []), ...(action.pendingResolvedFindingIds ?? [])])],
            xrayRunCount: 0,
          }]));
          setSession({ ...freshDemoSession(), reviewStates });
        }
      }
    } catch {
      // Ignore malformed local prototype state and continue with a clean review.
    } finally {
      setReviewStateHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!reviewStateHydrated) return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session, reviewStateHydrated]);
  const value = useMemo(() => ({
    profile: session.profile,
    setProfile: (profile: StudentProfile) => setSession((current) => ({ ...current, profile })),
    resetToDemo: () => {
      window.localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY);
      setSession(freshDemoSession());
    },
    evidenceDocuments: session.evidenceDocuments,
    updateEvidenceDocument: (documentId: string, update: Partial<EvidenceDocument>) => {
      setSession((current) => ({
        ...current,
        evidenceDocuments: current.evidenceDocuments.map((document) => document.id === documentId ? { ...document, ...update } : document),
      }));
    },
    reviewStates: session.reviewStates,
    reviewStateHydrated,
    updateReviewState: (scholarshipId: string, update: Partial<Omit<ApplicationReviewState, 'scholarshipId'>>) => {
      setSession((current) => {
        const existing = current.reviewStates[scholarshipId];
        return {
          ...current,
          reviewStates: {
            ...current.reviewStates,
            [scholarshipId]: {
              scholarshipId,
              reviewedFindingIds: update.reviewedFindingIds ?? existing?.reviewedFindingIds ?? [],
              xrayRunCount: update.xrayRunCount ?? existing?.xrayRunCount ?? 0,
            },
          },
        };
      });
    },
  }), [session, reviewStateHydrated]);
  return <AppState.Provider value={value}>{children}</AppState.Provider>;
}

export function useAppState() {
  const value = useContext(AppState);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
