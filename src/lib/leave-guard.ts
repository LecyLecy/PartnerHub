export type LeaveDecision = { decision?: Promise<boolean> };

/** Form guards attach their asynchronous decision synchronously during dispatch. */
export async function requestLeave(): Promise<boolean> {
  const detail: LeaveDecision = {};
  window.dispatchEvent(new CustomEvent<LeaveDecision>("partnerhub:before-leave", { detail }));
  return detail.decision ? await detail.decision : true;
}

/** Restore protection if logout or role switching failed after receiving consent. */
export function cancelLeave() {
  window.dispatchEvent(new Event("partnerhub:leave-cancelled"));
}
