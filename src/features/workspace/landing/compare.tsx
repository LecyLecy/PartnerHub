"use client";
import { useState } from "react";
import { Badge, TabPanel, Tabs, useTabsId } from "@/lib/ui";
import { applicantNote, compareTabs } from "./landing-data";
import styles from "../landing.module.css";

function Mock({ kind }: { kind: (typeof compareTabs)[number]["mock"] }) {
  if (kind === "ticket") return <div className={styles.miniCard}><Badge tone="success">Terdaftar</Badge><strong>Seminar Kepemimpinan Mahasiswa</strong><span>Aula Demo Utama</span><p className={styles.ref}>Referensi tiket<b>PH-K7M2-Q9DA</b></p></div>;
  if (kind === "applicant") return <div className={styles.miniCard}><Badge tone="success">Diterima</Badge><strong>Divisi Acara dan Humas</strong><span>Langkah berikutnya</span><p>{applicantNote}</p></div>;
  if (kind === "offer") return <div className={styles.miniCard}><Badge tone="info">Menunggu tanggapan</Badge><strong>Permintaan dukungan</strong><span>Perusahaan Contoh · Media partner</span><div className={styles.miniActions}><span>Terima</span><span>Tolak</span></div></div>;
  return <div className={styles.miniCard}><Badge tone="success">QR terkirim</Badge><strong>Tiket QR</strong><span>Tanpa data pribadi di dalam kode</span><p className={styles.ref}>Pemindaian masuk masih dalam pengembangan.</p></div>;
}

/** Segmented control that swaps the copy and the mock without changing the section height. */
export function Compare() {
  const base = useTabsId();
  const [value, setValue] = useState<string>(compareTabs[0].key);
  const tab = compareTabs.find((item) => item.key === value) ?? compareTabs[0];
  return <div>
    <div className={styles.center}><Tabs idBase={base} label="Keunggulan" items={compareTabs} value={value} onChange={setValue} /></div>
    <TabPanel idBase={base} value={value}>
      <div className={styles.compare}>
        <div>
          <h3>{tab.title}</h3>
          <dl>
            <dt>Cara yang biasa dipakai</dt><dd>{tab.before}</dd>
            <dt>Dengan PartnerHub</dt><dd>{tab.after}</dd>
          </dl>
        </div>
        <div className={styles.mockStage} aria-hidden="true"><Mock kind={tab.mock} /></div>
      </div>
    </TabPanel>
  </div>;
}
