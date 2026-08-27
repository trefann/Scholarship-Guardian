import type { Metadata } from 'next';
import source from '@/app/data/scholarships.json';
import { ScholarshipDetail } from '@/app/components/scholarship-detail';
import type { ScholarshipDataset } from '@/app/lib/types';

const dataset = source as ScholarshipDataset;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const scholarship = dataset.schemes.find((item) => item.id === id);
  const title = scholarship ? `${scholarship.short_name} · Scholarship Guardian` : 'Scholarship not found';
  const description = scholarship ? `See why ${scholarship.short_name} may match and trace every result to student information and demo evidence.` : 'Scholarship detail';
  return { title, description, openGraph: { title, description, images: [] }, twitter: { title, description, images: [] } };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ScholarshipDetail id={id} />; }
