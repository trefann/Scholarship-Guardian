'use client';

import Link from 'next/link';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { evaluateScholarship, fieldLabel, formatRequirement, formatValue } from '@/app/lib/rules-engine';
import type { MatchLevel, ScholarshipDataset } from '@/app/lib/types';
import { AppHeader } from './app-header';
import { EvidenceChain } from './evidence-chain';
import { StatusBadge } from './status-badge';

const dataset = source as ScholarshipDataset;
const matchLabels: Record<MatchLevel, string> = { strong_match: 'Strong match', possible_match: 'Possible match', not_currently_matching: 'Not currently matching' };

export function ScholarshipDetail({ id }: { id: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === id);
  const { profile, evidenceDocuments } = useAppState();
  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Scholarship not found</h1><Link className="button button-secondary" href="/matches">Back to matches</Link></section></main>;

  const evaluation = evaluateScholarship(profile, scholarship, evidenceDocuments);
  const counts = evaluation.results.reduce<Record<string, number>>((current, result) => ({ ...current, [result.status]: (current[result.status] ?? 0) + 1 }), {});
  return (
    <main><AppHeader step="matches" /><section className="detail-page">
      <Link className="back-link" href="/matches">← All matches</Link>
      <div className="detail-hero"><div><div className="scheme-meta"><span>{scholarship.authority}</span><span className="hero-scheme">{matchLabels[evaluation.level]}</span></div><h1>{scholarship.name}</h1><p className="page-lede">{scholarship.target_profile}.</p><p className="honesty-copy">This assessment uses a prototype research dataset, Arun’s synthetic profile, and structured demo evidence. It is not an eligibility guarantee.</p></div><aside className="scheme-overview" aria-label="Scholarship overview"><p className="eyebrow">Scheme overview</p><dl><div><dt>Authority</dt><dd>{scholarship.authority}</dd></div><div><dt>Application system</dt><dd>{scholarship.portal}</dd></div><div><dt>Reference status</dt><dd>Prototype dataset · current cycle must be re-verified</dd></div></dl></aside></div>

      <section className="detail-section" aria-labelledby="why-match-heading"><div className="section-heading"><div><p className="eyebrow">Based on your information and demo evidence</p><h2 id="why-match-heading">Why this may match you</h2><p>Open any check to see the complete path from requirement to next action.</p></div><div className="result-totals" aria-label="Assessment totals">{(['PASS', 'ATTENTION', 'BLOCKED', 'UNKNOWN'] as const).map((status) => <div key={status}><strong>{counts[status] ?? 0}</strong><StatusBadge status={status} /></div>)}</div></div>
        <div className="eligibility-list">{evaluation.results.map((result) => <article className={`eligibility-check check-${result.status.toLowerCase()}`} key={result.rule.id}><div className="check-heading"><div><p>{result.rule.required_for_eligibility ? 'Core eligibility check' : 'Authority-dependent outcome'}</p><h3>{fieldLabel(result.rule.field)}</h3></div><StatusBadge status={result.status} /></div><div className="check-grid"><div><span>Rule</span><strong>{formatRequirement(result.rule)}</strong></div><div><span>Your information</span><strong>{formatValue(result.actualValue, result.rule.field)}</strong><small className={`basis basis-${result.provenance.basis.toLowerCase()}`}>{result.provenance.label}{result.provenance.basis === 'DEMO_INFERENCE' ? ' · not verified' : ''}</small></div><div className="check-explanation"><span>Guardian assessment</span><p>{result.explanation}</p></div><div className="check-next-action"><span>Next action</span><p>{result.nextAction}</p></div></div><div className="rule-authority"><span>Source and context</span><p>{scholarship.authority}. Reference supplied by the prototype dataset; current-cycle details must be checked.</p>{scholarship.sources[0] && <a href={scholarship.sources[0].url} target="_blank" rel="noreferrer">Open {scholarship.sources[0].title} ↗</a>}</div><EvidenceChain evaluation={result} authority={scholarship.authority} /></article>)}</div>
      </section>

      <section className="uncertainty-panel"><div><p className="eyebrow">What remains outside Guardian</p><h2>Uncertainty is part of the answer.</h2></div><ul>{scholarship.unknowns.map((unknown) => <li key={unknown}><span aria-hidden="true">?</span>{unknown}</li>)}</ul></section>
      <section className="detail-actions"><div><strong>Next: prepare the evidence</strong><p>Review what is present, what Guardian can assess, and what still needs confirmation.</p></div><Link className="button button-primary" href={`/preparation/${scholarship.id}`}>Prepare application <span aria-hidden="true">→</span></Link></section>
    </section></main>
  );
}
