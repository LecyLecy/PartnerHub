import SponsorOffersPage from "@/features/sponsorship/sponsor-offers-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <SponsorOffersPage id={id} />; }
