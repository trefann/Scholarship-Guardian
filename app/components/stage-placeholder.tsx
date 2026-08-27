import Link from 'next/link';
import source from '@/app/data/scholarships.json';
import type { ScholarshipDataset } from '@/app/lib/types';
import { AppHeader } from './app-header';

const dataset = source as ScholarshipDataset;

export function StagePlaceholder({ id, title, description }: { id: string; title: string; description: string }) {
  const scholarship = dataset.schemes.find((item) => item.id === id);
  return <main><AppHeader /><section className="inner-page placeholder-page"><p className="eyebrow">Journey route ready</p><h1>{title}</h1><p className="page-lede">{description}</p>{scholarship && <div className="placeholder-card"><span>Selected scholarship</span><strong>{scholarship.name}</strong><p>{scholarship.authority}</p></div>}<p className="placeholder-note">This route is part of the initial application structure. Its full evidence and X-Ray interaction belongs to the next build phase.</p><Link className="button button-secondary" href="/matches">← Back to matches</Link></section></main>;
}
