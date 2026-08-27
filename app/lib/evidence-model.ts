import { documentTypeLabel, evaluateScholarship, fieldLabel } from './rules-engine';
import type { EvidenceDocument, PreparationItem, Scholarship, StudentProfile } from './types';

export function buildPreparationItems(
  scholarship: Scholarship,
  profile: StudentProfile,
  evidenceDocuments: EvidenceDocument[],
): PreparationItem[] {
  const evaluation = evaluateScholarship(profile, scholarship, evidenceDocuments);

  return scholarship.documents.map((requirement) => {
    const documents = evidenceDocuments.filter((document) => document.type === requirement.type);
    const linkedResults = evaluation.results.filter((result) => result.rule.evidence?.includes(requirement.type));
    const supportedResults = linkedResults.filter((result) => result.evidence.status === 'SUPPORTED' && result.status === 'PASS');
    const present = documents.length > 0;
    const currentCycleConfirmation = requirement.required === 'VERIFY_CURRENT_CYCLE';
    const fullyAssessable = linkedResults.length > 0 && supportedResults.length === linkedResults.length;
    const status = !present && requirement.required === true
      ? 'MISSING'
      : currentCycleConfirmation || !fullyAssessable
        ? 'ATTENTION'
        : 'READY';
    const supportedFields = linkedResults.map((result) => fieldLabel(result.rule.field));

    return {
      requirement,
      label: documentTypeLabel(requirement.type),
      present,
      status,
      documents,
      whyNeeded: supportedFields.length
        ? `Supports ${supportedFields.join(', ')} in the prototype rule assessment.`
        : 'Listed in the scheme dataset; its current-cycle requirement needs confirmation.',
      guardianAssessment: present
        ? fullyAssessable
          ? 'Structured demo fields are present and support the linked profile value.'
          : 'Document detected, but Guardian cannot assess every linked condition from its demo fields.'
        : currentCycleConfirmation
          ? 'Not present. The dataset says to verify whether it is required for the current cycle.'
          : 'No matching document is present in the synthetic evidence set.',
      nextAction: status === 'READY'
        ? 'Keep this document ready and confirm current-cycle acceptance before applying.'
        : present
          ? 'Review the extracted fields and confirm the remaining condition with the authoritative source.'
          : currentCycleConfirmation
            ? 'Check the current official requirements before preparing this document.'
            : 'Prepare this document before continuing. Upload and OCR are not part of this prototype.',
    };
  });
}
