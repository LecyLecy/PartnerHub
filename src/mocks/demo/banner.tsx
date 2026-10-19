"use client";
import { resetDemoData } from "./router";
import { useConfirm } from "@/lib/ui/confirmation";
import { requestLeave, cancelLeave } from "@/lib/leave-guard";
import Link from "next/link";
import { useState } from "react";
import { apiRequest, errorMessage } from "@/lib/api-client";

/** Presentation toolbar in local builds; underlying data remains explicitly simulated in storage. */
export default function DemoBanner() {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function switchRole(role: string) {
    if (!role || busy) return;
    if (!await requestLeave()) return;
    setBusy(true); setError("");
    try { await apiRequest("/api/demo/switch", { method: "POST", body: { role } }); window.location.assign(role === "organizer" ? "/organizer" : role === "sponsor" ? "/sponsor" : "/me"); }
    catch (error) { cancelLeave(); setError(errorMessage(error)); setBusy(false); }
  }
  async function reset() {
    if (busy || !await confirm({ title: "Reset data?", description: "Semua perubahan di sesi ini akan dihapus dan kamu akan keluar. Tindakan ini tidak dapat dibatalkan.", confirmLabel: "Reset data", destructive: true })) return;
    if (!await requestLeave()) return;
    resetDemoData();
    window.location.assign("/login");
  }
  return <div role="region" aria-label="Kontrol aplikasi" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", color: "#162748", padding: "10px 20px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", fontSize: ".875rem" }}>
    <span><strong>PartnerHub</strong></span>
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Link href="/guide">Panduan</Link>
      <a href="/demo/photos/CREDITS.md" target="_blank" rel="noreferrer">Sumber foto</a>
      <label>Ganti peran demo <select aria-label="Ganti peran demo" value="" disabled={busy} onChange={(event) => void switchRole(event.target.value)} style={{ minHeight: 44, borderRadius: 8, border: "1px solid #162748", padding: "4px 8px", background: "white" }}>
        <option value="">Pilih peran</option><option value="organizer">Penyelenggara</option><option value="user">Peserta / calon panitia</option><option value="sponsor">Sponsor</option>
      </select></label>
      <button type="button" onClick={() => void reset()} disabled={busy} style={{ minHeight: 44, padding: "6px 14px", border: "1px solid #162748", borderRadius: 8, background: "#fff", color: "#162748" }}>Reset data</button>
    </div>{error && <span role="alert">{error}</span>}
  </div>;
}
