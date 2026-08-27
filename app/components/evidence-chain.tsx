import { documentTypeLabel, formatRequirement, formatValue } from '@/app/lib/rules-engine';
import type { EvidenceChainData, RuleEvaluation } from '@/app/lib/types';
import { StatusBadge } from './status-badge';

export function EvidenceChain({ evaluation, authority, chain }: { evaluation?: RuleEvaluation; authority?: string; chain?: EvidenceChainData }) {
  if (!chain && (!evaluation || !authority)) return null;
  const normalized: EvidenceChainData = chain ?? {
    requirement: formatRequirement(evaluation!.rule),
    requirementContext: `Reference rule supplied for ${authority}`,
    studentValue: formatValue(evaluation!.actualValue, evaluation!.rule.field),
    studentContext: `${evaluation!.provenance.label} · Not independently verified`,
    documents: evaluation!.evidence.documents,
    evidenceSummary: evaluation!.evidence.summary,
    status: evaluation!.status,
    assessment: evaluation!.explanation,
    nextAction: evaluation!.nextAction,
  };
  return (
    <details className="evidence-chain">
      <summary><span className="chain-symbol" aria-hidden="true">↳</span><span>Why Guardian reached this result</span><span className="summary-action"><span className="summary-action-view">View evidence chain</span><span className="summary-action-hide">Hide evidence chain</span><span className="chain-chevron" aria-hidden="true">⌄</span></span></summary>
      <ol className="chain-steps">
        <li><span className="chain-index">1</span><div><p className="chain-label">Requirement</p><strong>{normalized.requirement}</strong><small>{normalized.requirementContext}</small></div></li>
        <li><span className="chain-index">2</span><div><p className="chain-label">Your information</p><strong>{normalized.studentValue}</strong><small>{normalized.studentContext}</small>{evaluation?.provenance.basis === 'DEMO_INFERENCE' && <p className="chain-caution">{evaluation.provenance.note}</p>}</div></li>
        <li><span className="chain-index">3</span><div><p className="chain-label">Evidence</p>{normalized.documents.length > 0 ? <div className="chain-documents">{normalized.documents.map((document) => <div key={document.id}><strong>{documentTypeLabel(document.type)}</strong><span>Synthetic demo document · detected</span><div className="extracted-row">{Object.entries(document).filter(([field]) => !['id', 'type', 'synthetic'].includes(field)).map(([field, value]) => <span key={field}>{field.replaceAll('_', ' ')}: <b>{formatValue(value, field === 'annual_income' ? 'annual_family_income' : field)}</b></span>)}</div></div>)}</div> : <strong>No linked document is present</strong>}<small>{normalized.evidenceSummary}</small></div></li>
        <li><span className="chain-index">4</span><div><p className="chain-label">Guardian assessment</p><StatusBadge status={normalized.status} /><p className="chain-explanation">{normalized.assessment}</p></div></li>
        <li><span className="chain-index">5</span><div><p className="chain-label">Next action</p><strong>{normalized.nextAction}</strong><small>Guardian does not guarantee eligibility or the authority’s final decision.</small></div></li>
      </ol>
    </details>
  );
}
