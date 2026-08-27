import { PreparationView } from '@/app/components/preparation-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PreparationView id={id} />; }
