import { Icon } from "./icons";
import styles from "./components.module.css";

export type StepState = "done" | "current" | "waiting" | "stopped" | "skipped" | "unknown";
export type Step = { key: string; label: string; state: StepState };
const stateText: Record<StepState, string> = { done: "Selesai", current: "Berjalan", waiting: "Menunggu", stopped: "Tidak dilanjutkan", skipped: "Dilewati", unknown: "Tidak tercatat" };

/** Ordered path of a process. State is written as text as well as color, so it reads without seeing hue. */
export function SelectionSteps({ steps, label }: { steps: readonly Step[]; label: string }) {
  return <ol className={styles.steps} aria-label={label}>
    {steps.map((step, index) => <li key={step.key} data-state={step.state}>
      <span className={styles.stepNode} aria-hidden="true">{step.state === "done" ? <Icon name="check" size={14} /> : step.state === "stopped" ? <Icon name="close" size={14} /> : index + 1}</span>
      <strong>{step.label}</strong>
      <span>{stateText[step.state]}</span>
    </li>)}
  </ol>;
}
