import { consistencyChecks } from '@/app/data/consistency-checks';
import { fieldLabel, formatRequirement, formatValue } from './rules-engine';
import type { ConsistencyCheckDefinition, EvidenceDocument, FindingStatus, Scholarship, StudentProfile, XRayFinding, XRayReport } from './types';
import { evaluateScholarship } from './rules-engine';

function ruleConfidence(finding: ReturnType<typeof evaluateScholarship>['results'][number]) {
  if (finding.status === 'UNKNOWN') return 'Authority decision · cannot be determined';
  if (finding.provenance.basis === 'AUTHORITY_DEPENDENT') return 'Needs current authoritative confirmation';
  if (finding.provenance.basis === 'DEMO_INFERENCE') return 'Demo inference · not independently verified';
  if (finding.evidence.status === 'SUPPORTED') return 'Structured demo evidence supports this check';
  if (finding.evidence.status === 'MISSING') return 'Evidence missing';
  return 'Based on student information and partial demo evidence';
}

function ruleFinding(scholarship: Scholarship, result: ReturnType<typeof evaluateScholarship>['results'][number]): XRayFinding {
  const authorityDependent = result.status === 'UNKNOWN' || result.provenance.basis === 'AUTHORITY_DEPENDENT';
  const preventable = !authorityDependent && (result.status === 'BLOCKED' || (result.status === 'ATTENTION' && result.evidence.status === 'MISSING'));
  const category = authorityDependent ? 'AUTHORITY_DEPENDENT' : result.evidence.status === 'MISSING' ? 'EVIDENCE' : 'ELIGIBILITY';
  const requirement = formatRequirement(result.rule);
  const studentValue = formatValue(result.actualValue, result.rule.field);
  return {
    id: `rule:${result.rule.id}`,
    title: `${fieldLabel(result.rule.field)} requirement`,
    status: result.status,
    category,
    requirement,
    studentValue,
    evidenceSummary: result.evidence.summary,
    explanation: result.explanation,
    recommendedAction: result.nextAction,
    sourceContext: `${scholarship.authority}. Reference rule supplied by the prototype dataset; current-cycle details have not been verified by Guardian.`,
    confidenceLabel: ruleConfidence(result),
    preventable,
    blocksReadiness: preventable && (result.status === 'ATTENTION' || result.status === 'BLOCKED'),
    authorityDependent,
    reviewedByUser: false,
    evidenceChain: {
      requirement,
      requirementContext: `Reference rule supplied for ${scholarship.authority}`,
      studentValue,
      studentContext: `${result.provenance.label} · Not independently verified`,
      documents: result.evidence.documents,
      evidenceSummary: result.evidence.summary,
      status: result.status,
      assessment: result.explanation,
      nextAction: result.nextAction,
    },
  };
}

function normalizedConsistencyValue(value: string | number | boolean) {
  return String(value).trim().replace(/\s+/g, ' ').toUpperCase();
}

export function evaluateConsistencyChecks(
  documents: EvidenceDocument[],
  reviewedFindingIds: string[],
  definitions: ConsistencyCheckDefinition[] = consistencyChecks,
): XRayFinding[] {
  const reviewed = new Set(reviewedFindingIds);
  return definitions.flatMap((definition) => {
    const comparable = documents.filter((document) => definition.documentTypes.includes(document.type) && document[definition.field] !== undefined);
    if (comparable.length < definition.minimumDocuments) return [];
    const values = comparable.map((document) => normalizedConsistencyValue(document[definition.field]!));
    const uniqueValues = [...new Set(values)];
    const mismatch = uniqueValues.length > 1;
    const reviewedByUser = mismatch && reviewed.has(definition.id);
    const status: FindingStatus = mismatch ? reviewedByUser ? 'REVIEWED' : 'ATTENTION' : 'PASS';
    const explanation = mismatch
      ? reviewedByUser
        ? 'You reviewed this difference, but the structured values still disagree. Review alone does not correct or verify either document.'
        : definition.explanation
      : `The available documents use the same ${definition.field} format.`;
    const recommendedAction = mismatch && !reviewedByUser
      ? definition.recommendedAction
      : mismatch
        ? 'Correct the synthetic evidence in this demo, then re-run X-Ray. For a real application, correct or clarify the authoritative record.'
        : 'No action is currently suggested for this consistency check.';

    return [{
      id: definition.id,
      title: definition.title,
      status,
      category: 'DOCUMENT_CONSISTENCY' as const,
      requirement: definition.requirement,
      studentValue: uniqueValues.join(' ≠ '),
      evidenceSummary: `${comparable.length} synthetic documents compared: ${comparable.map((document) => document.type.replaceAll('_', ' ').toLowerCase()).join(', ')}.`,
      explanation,
      recommendedAction,
      sourceContext: 'Guardian cross-document comparison of structured synthetic evidence. No government or identity system was consulted.',
      confidenceLabel: reviewedByUser ? 'Reviewed by the user · mismatch remains unresolved' : mismatch ? 'Exact structured-field mismatch detected' : 'Structured fields use the same format',
      preventable: mismatch,
      blocksReadiness: mismatch,
      authorityDependent: false,
      reviewedByUser,
      evidenceChain: {
        requirement: definition.requirement,
        requirementContext: 'Guardian consistency check · prototype logic, not an official eligibility rule',
        studentValue: uniqueValues.join(' ≠ '),
        studentContext: 'Values extracted from structured synthetic demo documents',
        documents: comparable,
        evidenceSummary: `${comparable.length} documents contain ${uniqueValues.length} distinct ${definition.field} formats.`,
        status,
        assessment: explanation,
        nextAction: recommendedAction,
      },
    }];
  });
}

export function evaluateApplication(
  scholarship: Scholarship,
  student: StudentProfile,
  evidence: EvidenceDocument[],
  reviewedFindingIds: string[] = [],
): XRayReport {
  const ruleFindings = evaluateScholarship(student, scholarship, evidence).results.map((result) => ruleFinding(scholarship, result));
  const consistencyFindings = evaluateConsistencyChecks(evidence, reviewedFindingIds);
  const findings = [...ruleFindings, ...consistencyFindings];
  const counts: Record<FindingStatus, number> = { PASS: 0, REVIEWED: 0, ATTENTION: 0, BLOCKED: 0, UNKNOWN: 0, NOT_APPLICABLE: 0 };
  findings.forEach((finding) => { counts[finding.status] += 1; });
  const unresolvedPreventable = findings.filter((finding) => finding.blocksReadiness);
  return {
    findings,
    counts,
    readiness: unresolvedPreventable.length ? 'NOT_READY' : 'READY_TO_APPLY',
    unresolvedPreventable,
    authorityDependent: findings.filter((finding) => finding.authorityDependent),
  };
}
