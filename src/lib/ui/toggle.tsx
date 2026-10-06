"use client";
import styles from "./components.module.css";

/** Switch with a 44px hit area. The visual track stays small. */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={styles.toggleHit} onClick={() => onChange(!checked)}>
    <span className={styles.toggle} data-on={checked} aria-hidden="true" />
  </button>;
}
