import { redirect } from "next/navigation";
import SubscriptionPage from "@/features/workspace/subscription/subscription-page";
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { event } = await searchParams;
  if (typeof event === "string" && /^[a-zA-Z0-9_-]+$/.test(event)) redirect(`/events/${encodeURIComponent(event)}/package`);
  return <SubscriptionPage />;
}
