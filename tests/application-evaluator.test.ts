import { describe, expect, it } from 'vitest';
import source from '@/app/data/scholarships.json';
import { evaluateApplication } from '@/app/lib/application-evaluator';
import { evaluateScholarship } from '@/app/lib/rules-engine';
import type { EvidenceDocument, ScholarshipDataset, StudentProfile } from '@/app/lib/types';

const dataset = source as ScholarshipDataset;
const scholarship = dataset.schemes.find((item) => item.id === 'pm_yasasvi_top_class_college')!;

function demoProfile(): StudentProfile {
  return { ...dataset.demo_student };
}

function demoEvidence(): EvidenceDocument[] {
  return dataset.demo_documents.map((document) => ({ ...document }));
}

describe('Application X-Ray readiness', () => {
  it('blocks readiness when structured document names disagree', () => {
    const report = evaluateApplication(scholarship, demoProfile(), demoEvidence());
    const mismatch = report.findings.find((finding) => finding.id === 'demo-name-mismatch');

    expect(mismatch?.status).toBe('ATTENTION');
    expect(mismatch?.blocksReadiness).toBe(true);
    expect(report.readiness).toBe('NOT_READY');
  });

  it('records review without clearing the mismatch blocker', () => {
    const report = evaluateApplication(scholarship, demoProfile(), demoEvidence(), ['demo-name-mismatch']);
    const mismatch = report.findings.find((finding) => finding.id === 'demo-name-mismatch');

    expect(mismatch?.status).toBe('REVIEWED');
    expect(mismatch?.reviewedByUser).toBe(true);
    expect(mismatch?.blocksReadiness).toBe(true);
    expect(report.readiness).toBe('NOT_READY');
  });

  it('clears the blocker only after the synthetic evidence is corrected', () => {
    const profile = demoProfile();
    const correctedEvidence = demoEvidence().map((document) => document.type === 'ADMISSION_PROOF' ? { ...document, name: profile.name } : document);
    const report = evaluateApplication(scholarship, profile, correctedEvidence, ['demo-name-mismatch']);
    const consistency = report.findings.find((finding) => finding.id === 'demo-name-mismatch');

    expect(consistency?.status).toBe('PASS');
    expect(consistency?.studentValue).toBe('ARUN KUMAR');
    expect(report.readiness).toBe('READY_TO_APPLY');
  });

  it('keeps authority-dependent outcomes unknown or attention instead of inventing certainty', () => {
    const report = evaluateApplication(scholarship, demoProfile(), demoEvidence());
    expect(report.authorityDependent.map((finding) => finding.status)).toEqual(['ATTENTION', 'UNKNOWN']);
  });

  it('keeps the full-time course mapping marked as an unverified demo inference', () => {
    const result = evaluateScholarship(demoProfile(), scholarship, demoEvidence()).results.find((item) => item.rule.field === 'course_is_prescribed_full_time');
    expect(result?.status).toBe('PASS');
    expect(result?.provenance.basis).toBe('DEMO_INFERENCE');
    expect(result?.provenance.independentlyVerified).toBe(false);
  });

  it('prevents readiness when a deterministic core rule is blocked', () => {
    const profile = { ...demoProfile(), category: 'General' };
    const correctedEvidence = demoEvidence().map((document) => document.type === 'ADMISSION_PROOF' ? { ...document, name: profile.name } : document);
    const report = evaluateApplication(scholarship, profile, correctedEvidence);
    expect(report.findings.find((finding) => finding.id === 'rule:py_category')?.status).toBe('BLOCKED');
    expect(report.readiness).toBe('NOT_READY');
  });
});
