import styles from "./components.module.css";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");

/** Overlapping initials. Decorative; put the people's names in nearby text. */
export function AvatarStack({ names, max = 4 }: { names: readonly string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return <span className={styles.avatars} aria-hidden="true">{shown.map((name) => <span key={name} className={styles.avatar}>{initials(name)}</span>)}{rest > 0 && <span className={styles.avatar}>+{rest}</span>}</span>;
}
