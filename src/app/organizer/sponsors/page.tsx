"use client";
import SponsorExplorePage from "@/features/sponsorship/sponsor-explore-page";
import { listEvents } from "@/features/event/services/event-service";
export default function Page() { return <SponsorExplorePage loadEvents={listEvents} />; }
