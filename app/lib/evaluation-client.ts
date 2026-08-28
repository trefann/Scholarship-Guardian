import type { EvaluationMetadata, EvidenceDocument, StudentProfile, XRayReport } from './types';

export type EvaluationRequest = {
  scholarshipId: string;
  profile: StudentProfile;
  evidenceDocuments: EvidenceDocument[];
  reviewedFindingIds: string[];
};

export type EvaluationResponse = {
  report: XRayReport;
  metadata: EvaluationMetadata;
};

export async function requestApplicationEvaluation(input: EvaluationRequest): Promise<EvaluationResponse> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Guardian could not run the server evaluation.');
  return response.json() as Promise<EvaluationResponse>;
}
