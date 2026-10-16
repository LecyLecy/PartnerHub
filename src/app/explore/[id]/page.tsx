import type { Metadata } from "next";
import PublicEventPage from "@/features/event/public-event-page";
export const metadata: Metadata = { title: "Detail event" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicEventPage id={id} />;
}
