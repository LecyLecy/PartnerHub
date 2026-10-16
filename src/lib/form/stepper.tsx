"use client";
import styles from "./form.module.css";

export type StepInfo = { key: string; label: string };

/** Progress indicator. Completed steps are reachable; later steps stay locked until reached. */
export function Stepper({ steps, current, reached, onGo }: { steps: readonly StepInfo[]; current: number; reached: number; onGo: (index: number) => void }) {
  return <nav aria-label="Langkah pendaftaran">
    <p className={styles.progressText} role="status">Langkah {current + 1} dari {steps.length}: {steps[current].label}</p>
    <ol className={styles.stepper}>
      {steps.map((step, index) => <li key={step.key}>
        <button type="button" className={`${styles.step} ${index < current ? styles.done : ""}`} aria-current={index === current ? "step" : undefined} disabled={index > reached || index === current} onClick={() => onGo(index)}>
          <span className={styles.stepNumber} aria-hidden="true">{index < current ? "✓" : index + 1}</span>{step.label}
        </button>
      </li>)}
    </ol>
  </nav>;
}
