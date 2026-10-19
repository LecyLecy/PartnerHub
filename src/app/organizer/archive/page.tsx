"use client";
import DashboardPage from "@/features/workspace/dashboard-page";
import { getOrganizerSummary, listEvents } from "@/features/event/services/event-service";
import { publicationErrors } from "@/features/event/lifecycle";
import type { EventRecord } from "@/contracts/event";
const isReady = (event: EventRecord) => publicationErrors(event).length === 0;
export default function Page() { return <DashboardPage archive isReady={isReady} loadEvents={listEvents} loadSummary={getOrganizerSummary} />; }
