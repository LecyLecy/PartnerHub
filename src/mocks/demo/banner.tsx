"use client";
import { resetDemoData } from "./router";

/** Always visible in demo builds so nobody mistakes demo data for a real account. */
export default function DemoBanner() {
  function reset() {
    if (!window.confirm("Reset data demo? Semua perubahan di sesi ini hilang dan kamu akan keluar.")) return;
    resetDemoData();
    window.location.assign("/login");
  }
  return <div role="region" aria-label="Mode demo" style={{ background: "#f5d765", color: "#162748", padding: "10px 20px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", fontSize: ".875rem" }}>
    <span><strong>Mode demo.</strong> Data fiktif, tersimpan hanya di tab ini, bukan akun atau acara nyata.</span>
    <button type="button" onClick={reset} style={{ minHeight: 44, padding: "6px 14px", border: "1px solid #162748", borderRadius: 8, background: "#fff", color: "#162748" }}>Reset data demo</button>
  </div>;
}
