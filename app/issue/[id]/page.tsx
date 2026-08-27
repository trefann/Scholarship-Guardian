import { IssueView } from '@/app/components/issue-view';
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const scholarship = Array.isArray(query.scholarship) ? query.scholarship[0] : query.scholarship;
  return <IssueView findingId={id} scholarshipId={scholarship ?? ''} />;
}
