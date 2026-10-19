"use client";
import Link from "next/link";
import { useState } from "react";
import { apiRequest, errorMessage } from "@/lib/api-client";
import type { EventPackage } from "@/contracts/billing";
import { packageTiers } from "@/contracts/billing";
import { Notice, uiStyles } from "@/lib/ui";
import styles from "./event-detail.module.css";
export { getEventPackage } from "@/lib/event-package";

export function EventPackagePanel({ id, value, reload }: { id: string; value: EventPackage; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [managerIds, setManagerIds] = useState(value.managerIds);
  const [email, setEmail] = useState("");
  async function saveManagers() {
    setBusy(true); setFailure("");
    try { await apiRequest(`/api/events/${encodeURIComponent(id)}/managers`, { method: "PUT", body: { accountIds: managerIds, email } }); reload(); }
    catch (error) { setFailure(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <section className={styles.package} aria-labelledby="event-package-title"><h2 id="event-package-title">Akses pengelola acara</h2>
    <p>{value.message}</p>
    {value.participantLimit && <p>Batas paket: {value.participantLimit.toLocaleString("id-ID")} peserta dan {value.managerLimit} pengelola termasuk pemilik.</p>}
    {value.serviceEndsAt && <p>Akses pengelolaan sampai {new Date(value.serviceEndsAt).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}.</p>}
    <p><Link className={uiStyles.secondary} href={`/events/${encodeURIComponent(id)}/package`}>{value.coverage ? `Paket ${packageTiers[value.coverage.tier].name}` : "Pilih paket"}</Link></p>
    {failure && <Notice error>{failure}</Notice>}
    {value.owner && <section className={styles.managers} aria-labelledby="manager-settings-title"><h3 id="manager-settings-title">Atur pengelola event ({value.managerIds.length}/{value.managerLimit ?? "-"})</h3><fieldset disabled={busy}><legend>Pengelola event, termasuk pemilik</legend>
      {value.managers.map(member => <label key={member.id} className={styles.manager}><input type="checkbox" checked={managerIds.includes(member.id)} disabled={member.id === value.ownerId} onChange={event => setManagerIds(previous => event.target.checked ? [...previous, member.id] : previous.filter(id => id !== member.id))} /> {member.name}</label>)}
      {!value.readOnly && <label className={styles.field}>Tambah lewat email penyelenggara terdaftar<input type="email" name="managerEmail" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>}
      <p>Akses hanya berlaku untuk acara ini. Data peserta dan pekerjaan lama tetap tersimpan saat akses dicabut.</p>
      <button type="button" className={uiStyles.secondary} onClick={() => void saveManagers()}>Simpan pengelola</button>
    </fieldset></section>}
  </section>;
}
