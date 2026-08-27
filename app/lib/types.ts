export type ResultStatus = 'PASS' | 'ATTENTION' | 'BLOCKED' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type FindingStatus = ResultStatus | 'REVIEWED';
export type MatchLevel = 'strong_match' | 'possible_match' | 'not_currently_matching';

export type StudentProfile = {
  id: string;
  name: string;
  state: string;
  native_state: string;
  category: string;
  course: string;
  study_level: string;
  year: number;
  annual_family_income: number;
  institution: string;
  institution_type: string;
  regular_course: boolean;
  is_diploma_student: boolean;
  post_class12_drop: boolean;
  receives_other_scholarship_or_fee_reimbursement: boolean;
  class12_percentile_band?: number;
};

export type EligibilityRule = {
  id: string;
  field: string;
  operator: 'IN' | 'LTE' | 'GTE' | 'EQ' | 'UNKNOWN';
  expected_value: string | number | boolean | string[] | null;
  unit?: string;
  classification: 'DETERMINISTIC' | 'DOCUMENT_DERIVED' | 'POTENTIAL' | 'UNKNOWN';
  required_for_eligibility: boolean;
  student_question?: string;
  evidence?: string[];
  guardian_behavior?: string;
};

export type DocumentRequirement = {
  type: string;
  required: boolean | 'VERIFY_CURRENT_CYCLE';
};

export type SourceReference = {
  title: string;
  url: string;
  type: string;
};

export type EvidenceDocument = {
  id: string;
  type: string;
  synthetic: boolean;
  [field: string]: string | number | boolean | undefined;
};

export type CommonDocumentType = {
  fields: string[];
};

export type Scholarship = {
  id: string;
  name: string;
  short_name: string;
  authority: string;
  portal: string;
  target_profile: string;
  mvp_priority: string;
  eligibility_rules: EligibilityRule[];
  documents: DocumentRequirement[];
  sources: SourceReference[];
  verification_stages: string[];
  unknowns: string[];
};

export type ScholarshipDataset = {
  dataset_version: string;
  status: string;
  important_note: string;
  schemes: Scholarship[];
  common_document_types: Record<string, CommonDocumentType>;
  demo_student: StudentProfile;
  demo_documents: EvidenceDocument[];
  demo_guardian_findings: GuardianFinding[];
};

export type GuardianFinding = {
  id: string;
  type: string;
  status: ResultStatus;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  finding: string;
  recommended_action: string;
  do_not_say: string;
};

export type RuleEvaluation = {
  rule: EligibilityRule;
  status: ResultStatus;
  actualValue: unknown;
  explanation: string;
  provenance: EvaluationProvenance;
  evidence: EvidenceAssessment;
  nextAction: string;
};

export type EvidenceAssessment = {
  status: 'SUPPORTED' | 'DETECTED' | 'MISSING' | 'NOT_REQUIRED';
  requiredTypes: string[];
  documents: EvidenceDocument[];
  canAssess: boolean;
  summary: string;
};

export type EvaluationProvenance = {
  basis: 'STUDENT_PROFILE' | 'DEMO_INFERENCE' | 'MISSING' | 'AUTHORITY_DEPENDENT';
  label: string;
  independentlyVerified: false;
  sourceField?: keyof StudentProfile;
  note: string;
};

export type MatchEvaluation = {
  scholarship: Scholarship;
  level: MatchLevel;
  results: RuleEvaluation[];
  passCount: number;
};

export type ApplicationReviewState = {
  scholarshipId: string;
  resolvedFindingIds: string[];
  pendingResolvedFindingIds: string[];
  xrayRunCount: number;
};

export type XRayCategory = 'ELIGIBILITY' | 'EVIDENCE' | 'DOCUMENT_CONSISTENCY' | 'AUTHORITY_DEPENDENT';

export type EvidenceChainData = {
  requirement: string;
  requirementContext: string;
  studentValue: string;
  studentContext: string;
  documents: EvidenceDocument[];
  evidenceSummary: string;
  status: FindingStatus;
  assessment: string;
  nextAction: string;
};

export type XRayFinding = {
  id: string;
  title: string;
  status: FindingStatus;
  category: XRayCategory;
  requirement: string;
  studentValue: string;
  evidenceSummary: string;
  explanation: string;
  recommendedAction: string;
  sourceContext: string;
  confidenceLabel: string;
  preventable: boolean;
  blocksReadiness: boolean;
  authorityDependent: boolean;
  resolvedByUser: boolean;
  evidenceChain: EvidenceChainData;
};

export type XRayReport = {
  findings: XRayFinding[];
  counts: Record<FindingStatus, number>;
  readiness: 'NOT_READY' | 'READY_TO_APPLY';
  unresolvedPreventable: XRayFinding[];
  authorityDependent: XRayFinding[];
};

export type ConsistencyCheckDefinition = {
  id: string;
  field: string;
  title: string;
  documentTypes: string[];
  minimumDocuments: number;
  requirement: string;
  explanation: string;
  recommendedAction: string;
};

export type PreparationItem = {
  requirement: DocumentRequirement;
  label: string;
  present: boolean;
  status: 'READY' | 'ATTENTION' | 'MISSING';
  documents: EvidenceDocument[];
  whyNeeded: string;
  guardianAssessment: string;
  nextAction: string;
};
