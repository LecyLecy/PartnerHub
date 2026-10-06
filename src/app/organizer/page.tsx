"use client";
import DashboardPage from "@/features/workspace/dashboard-page";
import { getOrganizerSummary, listEvents } from "@/features/event/services/event-service";
export default function Page() { return <DashboardPage loadEvents={listEvents} loadSummary={getOrganizerSummary}/>; }
