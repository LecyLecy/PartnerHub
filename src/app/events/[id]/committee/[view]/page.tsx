import { notFound } from "next/navigation";
import ApplicantsPage from "@/features/committee/applicants-page";
import { isApplicantsView } from "@/features/committee/applicants-views";

export default async function Page({ params }: { params: Promise<{ id: string; view: string }> }) {
  const { id, view } = await params;
  if (!isApplicantsView(view)) notFound();
  return <ApplicantsPage id={id} view={view} />;
}