import type { EligibilityRule, EvaluationProvenance, EvidenceAssessment, EvidenceDocument, MatchEvaluation, ResultStatus, RuleEvaluation, Scholarship, StudentProfile } from './types';

const FIELD_LABELS: Record<string, string> = {
  category: 'Category',
  annual_family_income: 'Family income',
  course_is_prescribed_full_time: 'Full-time course',
  institution_currently_notified: 'Current institution status',
  scheme_slot_available: 'Scheme capacity',
  native_state: 'Native state',
  institution_type: 'Institution type',
  study_level: 'Study level',
  available_places: 'Available places',
  class12_percentile_band: 'Class XII percentile band',
  regular_course: 'Regular course',
  receives_other_scholarship_or_fee_reimbursement: 'Other scholarship or fee reimbursement',
  is_diploma_student: 'Diploma status',
  post_class12_drop: 'Post-Class-XII drop',
};

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replaceAll('_', ' ');
}

type EvaluationInput = { value: unknown; provenance: EvaluationProvenance };

function evaluationInput(profile: StudentProfile, field: string): EvaluationInput {
  if (field === 'course_is_prescribed_full_time') {
    return {
      value: profile.regular_course,
      provenance: {
        basis: 'DEMO_INFERENCE',
        label: 'Demo inference',
        independentlyVerified: false,
        sourceField: 'regular_course',
        note: 'For this prototype, regular_course is mapped to course_is_prescribed_full_time because the dataset requires that field. This is an inference from the demo profile, not an independently verified fact.',
      },
    };
  }

  if (field === 'institution_currently_notified') {
    return {
      value: profile.institution,
      provenance: {
        basis: 'STUDENT_PROFILE',
        label: 'Based on your information',
        independentlyVerified: false,
        sourceField: 'institution',
        note: 'The institution name comes from the student profile. Its current-cycle notified status has not been independently verified.',
      },
    };
  }

  const value = (profile as unknown as Record<string, unknown>)[field];
  if (value === undefined || value === null || value === '') {
    return {
      value,
      provenance: {
        basis: 'MISSING',
        label: 'Needs information',
        independentlyVerified: false,
        note: 'No usable value is available in the student profile.',
      },
    };
  }

  return {
    value,
    provenance: {
      basis: 'STUDENT_PROFILE',
      label: 'Based on your information',
      independentlyVerified: false,
      sourceField: field as keyof StudentProfile,
      note: 'This value comes from the student profile and has not been independently verified.',
    },
  };
}

const DOCUMENT_FIELD_BY_RULE_FIELD: Record<string, string> = {
  category: 'category',
  annual_family_income: 'annual_income',
  native_state: 'state',
  institution_currently_notified: 'institution',
  study_level: 'study_level',
  course_is_prescribed_full_time: 'course',
  regular_course: 'course',
  is_diploma_student: 'course',
};

export function documentTypeLabel(type: string) {
  return type.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function formatValue(value: unknown, field?: string) {
  if (value === undefined || value === null || value === '') return 'Not available';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number' && field === 'annual_family_income') return `₹${value.toLocaleString('en-IN')} per year`;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function formatRequirement(rule: EligibilityRule) {
  if (rule.operator === 'UNKNOWN') return 'Depends on current capacity or an authority decision.';
  const expected = rule.expected_value;
  if (rule.operator === 'IN' && Array.isArray(expected)) return `Must be one of: ${expected.join(', ')}`;
  if (rule.operator === 'LTE' && typeof expected === 'number') return `Must be ${rule.unit === 'INR' ? `₹${expected.toLocaleString('en-IN')}` : expected} or less`;
  if (rule.operator === 'GTE' && typeof expected === 'number') return `Must be ${expected} or higher${rule.unit === 'PERCENTILE_BAND' ? ' in the applicable percentile band' : ''}`;
  if (rule.operator === 'EQ') return `Must be ${formatValue(expected)}`;
  return 'See the published scheme rule.';
}

function compareEvidenceValue(documentValue: unknown, actualValue: unknown) {
  if (typeof documentValue === 'string' && typeof actualValue === 'string') return documentValue.trim().toLowerCase() === actualValue.trim().toLowerCase();
  return documentValue === actualValue;
}

function evaluateEvidence(rule: EligibilityRule, actualValue: unknown, documents?: EvidenceDocument[]): EvidenceAssessment {
  const requiredTypes = rule.evidence ?? [];
  if (!requiredTypes.length) return { status: 'NOT_REQUIRED', requiredTypes, documents: [], canAssess: false, summary: 'No evidence type is linked to this prototype rule.' };
  if (!documents) return { status: 'NOT_REQUIRED', requiredTypes, documents: [], canAssess: false, summary: 'Evidence was not included in this match-stage assessment.' };

  const linkedDocuments = documents.filter((document) => requiredTypes.includes(document.type));
  if (!linkedDocuments.length) {
    return {
      status: 'MISSING',
      requiredTypes,
      documents: [],
      canAssess: false,
      summary: `No ${requiredTypes.map(documentTypeLabel).join(' or ')} is present in the demo evidence.`,
    };
  }

  const evidenceField = DOCUMENT_FIELD_BY_RULE_FIELD[rule.field];
  const assessableDocument = evidenceField ? linkedDocuments.find((document) => document[evidenceField] !== undefined) : undefined;
  const canAssess = Boolean(assessableDocument);
  const supported = canAssess && compareEvidenceValue(assessableDocument?.[evidenceField], actualValue);

  return {
    status: supported ? 'SUPPORTED' : 'DETECTED',
    requiredTypes,
    documents: linkedDocuments,
    canAssess,
    summary: supported
      ? `${documentTypeLabel(assessableDocument!.type)} contains a matching structured demo value.`
      : `Synthetic ${linkedDocuments.map((document) => documentTypeLabel(document.type)).join(', ')} detected, but it does not independently verify this complete rule.`,
  };
}

function nextActionFor(status: ResultStatus, provenance: EvaluationProvenance, evidence: EvidenceAssessment) {
  if (status === 'UNKNOWN') return 'Keep this as an authority-dependent outcome; do not treat it as guaranteed.';
  if (status === 'BLOCKED') return 'Review the student information and the published rule before deciding whether to continue.';
  if (provenance.basis === 'DEMO_INFERENCE') return 'Confirm that the course is prescribed and full-time against the current official scheme information.';
  if (evidence.status === 'MISSING') return `Prepare ${evidence.requiredTypes.map(documentTypeLabel).join(' or ')} before applying.`;
  if (status === 'ATTENTION') return 'Confirm this item against the current authoritative scheme information.';
  if (evidence.status === 'SUPPORTED') return 'Keep this document ready and confirm that it is accepted for the current application cycle.';
  return 'Review the linked evidence and current official requirements before applying.';
}

function compare(actual: unknown, rule: EligibilityRule): boolean {
  switch (rule.operator) {
    case 'EQ': return actual === rule.expected_value;
    case 'IN': return Array.isArray(rule.expected_value) && rule.expected_value.includes(actual as string);
    case 'LTE': return typeof actual === 'number' && typeof rule.expected_value === 'number' && actual <= rule.expected_value;
    case 'GTE': return typeof actual === 'number' && typeof rule.expected_value === 'number' && actual >= rule.expected_value;
    default: return false;
  }
}

export function evaluateRule(profile: StudentProfile, rule: EligibilityRule, documents?: EvidenceDocument[]): RuleEvaluation {
  const { value: actualValue, provenance } = evaluationInput(profile, rule.field);
  const evidence = evaluateEvidence(rule, actualValue, documents);

  if (rule.operator === 'UNKNOWN' || rule.classification === 'UNKNOWN') {
    return {
      rule,
      status: 'UNKNOWN',
      actualValue,
      explanation: rule.guardian_behavior ?? 'This depends on current information or an authority decision.',
      provenance: {
        basis: 'AUTHORITY_DEPENDENT',
        label: 'Authority decision',
        independentlyVerified: false,
        note: 'Guardian cannot determine this value from the student profile.',
      },
      evidence,
      nextAction: 'Keep this as an authority-dependent outcome; do not treat it as guaranteed.',
    };
  }

  if (rule.classification === 'POTENTIAL') {
    return {
      rule,
      status: 'ATTENTION',
      actualValue,
      explanation: rule.guardian_behavior ?? 'This needs confirmation from an authoritative current source.',
      provenance: {
        basis: 'AUTHORITY_DEPENDENT',
        label: 'Needs confirmation',
        independentlyVerified: false,
        note: 'A current authoritative source is required before this can be treated as verified.',
      },
      evidence,
      nextAction: 'Confirm this item against the current authoritative scheme information.',
    };
  }

  if (actualValue === undefined || actualValue === null || actualValue === '') {
    return { rule, status: 'ATTENTION', actualValue, explanation: `Add or confirm your ${fieldLabel(rule.field).toLowerCase()} to assess this rule.`, provenance, evidence, nextAction: nextActionFor('ATTENTION', provenance, evidence) };
  }

  const passed = compare(actualValue, rule);
  const baseStatus: ResultStatus = passed ? 'PASS' : 'BLOCKED';
  const status: ResultStatus = baseStatus === 'PASS' && evidence.status === 'MISSING' ? 'ATTENTION' : baseStatus;
  return {
    rule,
    status,
    actualValue,
    explanation: provenance.basis === 'DEMO_INFERENCE'
      ? `${provenance.note} The mapped value ${passed ? 'supports' : 'does not currently satisfy'} this prototype rule.`
      : passed
        ? `Your information supports the published ${fieldLabel(rule.field).toLowerCase()} condition.`
        : `Your information does not currently satisfy the published ${fieldLabel(rule.field).toLowerCase()} condition.`,
    provenance,
    evidence,
    nextAction: nextActionFor(status, provenance, evidence),
  };
}

export function evaluateScholarship(profile: StudentProfile, scholarship: Scholarship, documents?: EvidenceDocument[]): MatchEvaluation {
  const results = scholarship.eligibility_rules.map((rule) => evaluateRule(profile, rule, documents));
  const required = results.filter((result) => result.rule.required_for_eligibility);
  const hasBlocker = required.some((result) => result.status === 'BLOCKED');
  const needsConfirmation = required.some((result) => result.status === 'ATTENTION' || result.status === 'UNKNOWN');
  const level = hasBlocker ? 'not_currently_matching' : needsConfirmation ? 'possible_match' : 'strong_match';

  return {
    scholarship,
    level,
    results,
    passCount: results.filter((result) => result.status === 'PASS').length,
  };
}
