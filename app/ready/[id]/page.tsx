import { ReadyView } from '@/app/components/ready-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ReadyView id={id} />; }
