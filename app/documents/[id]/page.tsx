import { DocumentsView } from '@/app/components/documents-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <DocumentsView id={id} />; }
