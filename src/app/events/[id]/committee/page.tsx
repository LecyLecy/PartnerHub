import CommitteeManagePage from "@/features/committee/committee-manage-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CommitteeManagePage id={id} />; }
