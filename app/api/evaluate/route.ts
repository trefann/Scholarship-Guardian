import source from '@/app/data/scholarships.json';
import { evaluateApplication } from '@/app/lib/application-evaluator';
import type { EvaluationMetadata, EvidenceDocument, ScholarshipDataset, StudentProfile } from '@/app/lib/types';

const dataset = source as ScholarshipDataset;

type EvaluationBody = {
  scholarshipId?: unknown;
  profile?: unknown;
  evidenceDocuments?: unknown;
  reviewedFindingIds?: unknown;
};

function isStudentProfile(value: unknown): value is StudentProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.name === 'string'
    && typeof profile.category === 'string'
    && typeof profile.annual_family_income === 'number'
    && typeof profile.institution === 'string'
    && typeof profile.regular_course === 'boolean';
}

function isEvidenceDocumentArray(value: unknown): value is EvidenceDocument[] {
  return Array.isArray(value) && value.every((document) => document
    && typeof document === 'object'
    && typeof (document as Record<string, unknown>).id === 'string'
    && typeof (document as Record<string, unknown>).type === 'string'
    && (document as Record<string, unknown>).synthetic === true);
}

export async function POST(request: Request) {
  let body: EvaluationBody;
  try {
    body = await request.json() as EvaluationBody;
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (typeof body.scholarshipId !== 'string' || !isStudentProfile(body.profile) || !isEvidenceDocumentArray(body.evidenceDocuments)) {
    return Response.json({ error: 'A scholarship ID, student profile, and synthetic evidence documents are required.' }, { status: 400 });
  }

  const scholarship = dataset.schemes.find((item) => item.id === body.scholarshipId);
  if (!scholarship) return Response.json({ error: 'Scholarship not found.' }, { status: 404 });

  const reviewedFindingIds = Array.isArray(body.reviewedFindingIds)
    ? body.reviewedFindingIds.filter((id): id is string => typeof id === 'string')
    : [];
  const report = evaluateApplication(scholarship, body.profile, body.evidenceDocuments, reviewedFindingIds);
  const metadata: EvaluationMetadata = {
    datasetVersion: dataset.dataset_version,
    datasetStatus: dataset.status,
    evaluationMode: 'SERVER_RULE_ENGINE',
    sourceVerification: 'REVERIFY_CURRENT_CYCLE',
    sourceUrls: scholarship.sources.map((item) => item.url),
    evaluatedAt: new Date().toISOString(),
  };

  return Response.json({ report, metadata });
}
