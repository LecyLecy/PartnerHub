import { Badge } from "@/lib/ui";
import { Icon, LogoWordmark } from "@/lib/ui/icons";
import { previewRows } from "./landing-data";
import type { CSSProperties } from "react";
import styles from "../landing.module.css";

/** Static imitation of the organizer workspace with illustrative numbers. Hidden from assistive technology; the caption says what it is. */
export function DashboardPreview() {
  return <div className={styles.mock} aria-hidden="true">
    <div className={styles.mockSide}>
      <div className={styles.mockBrand}><LogoWordmark width={120} /></div>
      <div className={styles.mockGroup}><small>Menu utama</small>
        <span className={styles.mockItem} data-active="true"><Icon name="calendar" size={16} />Event kamu</span>
        <span className={styles.mockItem}><Icon name="plus" size={16} />Susun event</span>
      </div>
      <div className={styles.mockGroup}><small>Akun</small>
        <span className={styles.mockItem}><Icon name="settings" size={16} />Settings</span>
      </div>
    </div>
    <div className={styles.mockMain}>
      <div className={styles.mockBar}>
        <span>Overview acara</span>
        <span className={styles.mockSearch}><Icon name="search" size={14} />Cari<kbd>Ctrl K</kbd></span>
      </div>
      <div className={styles.mockStats}>
        <div><strong>204</strong><span>pendaftar</span></div>
        <div><strong>25</strong><span>lamaran panitia</span></div>
        <div><strong>3</strong><span>sponsor</span></div>
      </div>
      <table className={styles.mockTable}>
        <thead><tr><th>Acara</th><th>Status</th><th>Pendaftar</th><th>Lamaran</th><th>Sponsor</th></tr></thead>
        <tbody>{previewRows.map((row) => <tr key={row.title}>
          <td>{row.title}</td>
          <td><Badge tone={row.tone}>{row.status}</Badge></td>
          <td><span className={styles.bar}><i style={{ "--p": row.filled / row.capacity } as CSSProperties} /></span>{row.filled}/{row.capacity}</td>
          <td>{row.applications}</td>
          <td>{row.sponsors}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
