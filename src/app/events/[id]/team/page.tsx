import EventPackagePage from "@/features/event/event-package-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <EventPackagePage id={id} />; }
