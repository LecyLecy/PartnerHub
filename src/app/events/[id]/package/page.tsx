import PackagesPage from "@/features/workspace/subscription/packages-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackagesPage eventId={id} />;
}
