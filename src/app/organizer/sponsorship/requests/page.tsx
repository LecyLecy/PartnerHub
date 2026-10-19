"use client";
import OrganizerSponsorshipPage from "@/features/sponsorship/organizer-sponsorship-page";
import { listEvents } from "@/features/event/services/event-service";
export default function Page() { return <OrganizerSponsorshipPage loadEvents={listEvents} view="requests" />; }
