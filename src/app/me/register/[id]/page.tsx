import EventRegistrationPage from "@/features/registration/event-registration-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventRegistrationPage id={id} />;
}
