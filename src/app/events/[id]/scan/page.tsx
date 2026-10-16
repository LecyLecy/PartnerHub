import ScanPage from "@/features/attendance/scan-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ScanPage key={id} id={id} />; }
