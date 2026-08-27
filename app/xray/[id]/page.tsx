import { XRayView } from '@/app/components/xray-view';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <XRayView id={id} />; }
