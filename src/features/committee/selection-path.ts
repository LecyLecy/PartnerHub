import type { CommitteeApplication } from "@/contracts/committee";
import type { Step } from "@/lib/ui";

export const applicationLabel: Record<CommitteeApplication["status"], string> = { SUBMITTED: "Terkirim", IN_SELECTION: "Dalam seleksi", ACCEPTED: "Diterima", REJECTED: "Belum diterima", WITHDRAWN: "Ditarik" };
export const applicationTone = (status: CommitteeApplication["status"]) => status === "ACCEPTED" ? "success" : status === "REJECTED" ? "danger" : status === "WITHDRAWN" ? "neutral" : status === "SUBMITTED" ? "info" : "warning";

/**
 * The whole path an application travels: "Lamaran masuk", the organizer's own stages, then "Diterima".
 * A rejected or withdrawn application stops on the step it was on, and later steps stay waiting.
 */
export function selectionPath(application: Pick<CommitteeApplication, "status" | "stageId" | "stages" | "visitedStageIds">): Step[] {
  const names = ["Lamaran masuk", ...application.stages.map((stage) => stage.name), "Diterima"];
  const stageIndex = application.stages.findIndex((stage) => stage.id === application.stageId);
  const here = application.status === "ACCEPTED" ? names.length : application.status === "SUBMITTED" || stageIndex < 0 ? 0 : stageIndex + 1;
  return names.map((label, index) => {
    const key = index === 0 ? "submitted" : index === names.length - 1 ? "accepted" : application.stages[index - 1].id;
    const recorded = application.visitedStageIds;
    const completed = index === 0 || index === names.length - 1 || recorded?.includes(key);
    if (application.status === "ACCEPTED") return { key, label, state: completed ? "done" : recorded ? "skipped" : "unknown" };
    if (index < here) return { key, label, state: index === 0 || recorded?.includes(key) ? "done" : recorded ? "skipped" : "unknown" };
    if (index === here) return { key, label, state: application.status === "REJECTED" || application.status === "WITHDRAWN" ? "stopped" as const : "current" as const };
    return { key, label, state: "waiting" as const };
  });
}
