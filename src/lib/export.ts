import { buildXlsx, XLSX_MIME, type XlsxSheet } from "./xlsx";

/** "Seminar Kepemimpinan 2026" becomes "seminar-kepemimpinan-2026", safe as part of a file name. */
export const fileSlug = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "acara";

/** Jakarta time as "26 Okt 2026 09.00". Spreadsheets get text so the value never changes with the viewer's locale. */
export const exportTime = (iso: string | null) => iso ? new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

/** Builds the workbook in the browser and saves it. Nothing is sent to a server. */
export function downloadXlsx(filename: string, sheets: readonly XlsxSheet[]) {
  const blob = new Blob([new Uint8Array(buildXlsx(sheets))], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}