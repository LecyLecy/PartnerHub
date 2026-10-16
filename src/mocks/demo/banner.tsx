"use client";
import { resetDemoData } from "./router";
import Link from "next/link";
import { useState } from "react";
import { apiRequest, errorMessage } from "@/lib/api-client";

/** Always visible in demo builds so nobody mistakes demo data for a real account. */
export default function DemoBanner() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function switchRole(role: string) {
    if (!role || busy) return;
    if (!window.dispatchEvent(new Event("partnerhub:before-leave", { cancelable: true }))) return;
    setBusy(true); setError("");
    try { await apiRequest("/api/demo/switch", { method: "POST", body: { role } }); window.location.assign(role === "organizer" ? "/organizer" : role === "sponsor" ? "/sponsor" : "/me"); }
    catch (error) { setError(errorMessage(error)); setBusy(false); }
  }
  function reset() {
    if (!window.confirm("Reset data demo? Semua perubahan di sesi ini hilang dan kamu akan keluar.")) return;
    resetDemoData();
    window.location.assign("/login");
  }
  return <div role="region" aria-label="Mode demo" style={{ background: "#f5d765", color: "#162748", padding: "10px 20px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", fontSize: ".875rem" }}>
    <span><strong>Mode demo.</strong> Data fiktif, tersimpan hanya di tab ini, bukan akun atau acara nyata.</span>
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Link href="/guide">Panduan demo</Link>
      <label>Ganti peran demo <select aria-label="Ganti peran demo" value="" disabled={busy} onChange={(event) => void switchRole(event.target.value)} style={{ minHeight: 44, borderRadius: 8, border: "1px solid #162748", padding: "4px 8px", background: "white" }}>
        <option value="">Pilih peran</option><option value="organizer">Penyelenggara</option><option value="user">Peserta / calon panitia</option><option value="sponsor">Sponsor</option>
      </select></label>
      <button type="button" onClick={reset} disabled={busy} style={{ minHeight: 44, padding: "6px 14px", border: "1px solid #162748", borderRadius: 8, background: "#fff", color: "#162748" }}>Reset data demo</button>
    </div>{error && <span role="alert">{error}</span>}
  </div>;
}
