'use client';

import Link from 'next/link';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { documentTypeLabel, formatValue } from '@/app/lib/rules-engine';
import type { ScholarshipDataset } from '@/app/lib/types';
import { AppHeader } from './app-header';
import { RunXRayButton } from './run-xray-button';

const dataset = source as ScholarshipDataset;

export function DocumentsView({ id }: { id: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === id);
  const { evidenceDocuments } = useAppState();
  if (!scholarship) return <main><AppHeader /><section className="inner-page"><h1>Scholarship not found</h1></section></main>;
  const requiredTypes = new Set(scholarship.documents.map((item) => item.type));
  return (
    <main><AppHeader step="prepare" scholarshipId={id} /><section className="documents-page">
      <Link className="back-link" href={`/preparation/${id}`}>← Preparation checklist</Link>
      <div className="page-heading"><p className="eyebrow">Structured demo evidence</p><h1>See exactly what Guardian can read.</h1><p className="page-lede">These are preloaded synthetic records for Arun Kumar. There is no upload, OCR, authenticity check, or government verification in this prototype.</p></div>
      <div className="document-grid">{evidenceDocuments.map((document) => <article className="evidence-document" key={document.id}><div className="document-topline"><span className="document-icon" aria-hidden="true">▤</span><div><p>{requiredTypes.has(document.type) ? 'Used for this scholarship' : 'Available demo evidence'}</p><h2>{documentTypeLabel(document.type)}</h2></div><span className="synthetic-badge">Synthetic</span></div><dl>{Object.entries(document).filter(([field]) => !['id', 'type', 'synthetic'].includes(field)).map(([field, value]) => <div key={field}><dt>{field.replaceAll('_', ' ')}</dt><dd>{formatValue(value, field === 'annual_income' ? 'annual_family_income' : field)}</dd></div>)}</dl><div className="document-foot"><span>Structured fields supplied by dataset</span><strong>{document.id}</strong></div></article>)}</div>
      <section className="evidence-boundary"><div><span aria-hidden="true">i</span><div><strong>What “detected” means here</strong><p>Guardian can use these preloaded fields to explain a prototype assessment. It does not mean the document is authentic, current, accepted, or verified by an authority.</p></div></div></section>
      <section className="next-phase-card"><div><p className="eyebrow">Evidence is connected</p><h2>Run a transparent pre-submission inspection.</h2><p>X-Ray will combine the selected scheme, Arun’s synthetic profile, these evidence records, and cross-document consistency checks.</p></div><div className="xray-entry-actions"><Link className="button button-secondary" href={`/scholarship/${id}`}>Review Evidence Chains</Link><RunXRayButton scholarshipId={id} label="Run Application X-Ray" /></div></section>
    </section></main>
  );
}
