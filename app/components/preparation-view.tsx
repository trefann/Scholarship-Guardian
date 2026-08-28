'use client';

import Link from 'next/link';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { buildPreparationItems } from '@/app/lib/evidence-model';
import type { ScholarshipDataset } from '@/app/lib/types';
import { AppHeader } from './app-header';
import { RunXRayButton } from './run-xray-button';

const dataset = source as ScholarshipDataset;
const statusCopy = { READY: 'Present and assessable', ATTENTION: 'Needs attention', MISSING: 'Not present' } as const;

export function PreparationView({ id }: { id: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === id);
  const { profile, evidenceDocuments } = useAppState();
  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Scholarship not found</h1></section></main>;
  const items = buildPreparationItems(scholarship, profile, evidenceDocuments);
  const readyCount = items.filter((item) => item.status === 'READY').length;
  return (
    <main><AppHeader step="prepare" scholarshipId={id} /><section className="preparation-page">
      <Link className="back-link" href={`/scholarship/${id}`}>← Scholarship details</Link>
      <div className="preparation-heading"><div><p className="eyebrow">Application preparation</p><h1>Know what each document proves.</h1><p className="page-lede">A concise checklist for {scholarship.short_name}, based on the supplied prototype requirements and synthetic demo evidence.</p></div><aside><strong>{readyCount} of {items.length}</strong><span>present and assessable</span><p>This is preparation readiness—not eligibility or selection.</p></aside></div>
      <div className="preparation-list">{items.map((item) => <article className={`preparation-item prep-${item.status.toLowerCase()}`} key={item.requirement.type}><div className="prep-status-icon" aria-hidden="true">{item.status === 'READY' ? '✓' : item.status === 'MISSING' ? '○' : '!'}</div><div className="prep-content"><div className="prep-heading"><div><h2>{item.label}</h2><p>{item.requirement.required === true ? 'Required in prototype dataset' : 'Verify current-cycle requirement'}</p></div><span>{statusCopy[item.status]}</span></div><div className="prep-details"><div><span>Why it is needed</span><p>{item.whyNeeded}</p></div><div><span>Guardian assessment</span><p>{item.guardianAssessment}</p></div><div><span>Next action</span><p>{item.nextAction}</p></div></div>{item.documents.length > 0 && <div className="document-detected"><span>Demo evidence detected</span>{item.documents.map((document) => <strong key={document.id}>{document.id}</strong>)}</div>}</div></article>)}</div>
      <p className="dataset-note"><strong>Synthetic evidence only.</strong> No document was uploaded, scanned, authenticated, or checked with a government system. Extracted fields are preloaded structured demo data.</p>
      <section className="xray-entry"><div><p className="eyebrow">Pre-submission inspection</p><h2>See what could still go wrong.</h2><p>Application X-Ray combines your profile, scheme rules, available evidence, and cross-document consistency. It is Guardian’s readiness assessment—not an eligibility score.</p></div><div className="xray-entry-actions"><Link className="button button-secondary" href={`/documents/${id}`}>Review evidence</Link><RunXRayButton scholarshipId={id} /></div></section>
    </section></main>
  );
}
