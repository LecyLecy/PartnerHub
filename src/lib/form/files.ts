export type FileKind = "logo" | "document";

export const fileRules = {
  logo: { types: ["image/png", "image/jpeg", "image/webp"], maxBytes: 2 * 1024 * 1024, maxSide: 4096, accept: "image/png,image/jpeg,image/webp", help: "PNG, JPG, WebP. Maks. 2 MB, 4096 × 4096 px." },
  document: { types: ["application/pdf", "image/png", "image/jpeg"], maxBytes: 5 * 1024 * 1024, maxSide: 0, accept: "application/pdf,image/png,image/jpeg", help: "PDF, PNG, JPG. Maks. 5 MB." },
} as const;

/** Reads the first bytes to confirm the real format. The browser-reported MIME type alone is not trusted. */
async function sniff(file: Blob): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const at = (text: string, offset = 0) => [...text].every((char, index) => bytes[offset + index] === char.charCodeAt(0));
  if (bytes[0] === 0x89 && at("PNG", 1)) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (at("RIFF") && at("WEBP", 8)) return "image/webp";
  if (at("%PDF")) return "application/pdf";
  return null;
}

/** Client-side guard. The server must repeat type, size, and content inspection. */
export async function inspectFile(file: File, kind: FileKind): Promise<string | null> {
  const rule = fileRules[kind];
  if (!file.size) return "File kosong. Pilih file yang lain.";
  if (file.size > rule.maxBytes) return `Ukuran file maksimal ${rule.maxBytes / 1024 / 1024} MB. Kecilkan file lalu coba lagi.`;
  const real = await sniff(file);
  const allowed: readonly string[] = rule.types;
  if (!real || !allowed.includes(real)) return kind === "logo" ? "Gunakan PNG, JPG, atau WebP. SVG, GIF, dan PDF tidak didukung." : "Gunakan PDF, PNG, atau JPG.";
  if (kind === "logo") {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return "Gambar tidak bisa dibaca. Pilih file gambar yang valid.";
    const { width, height } = bitmap;
    bitmap.close();
    if (width > rule.maxSide || height > rule.maxSide) return "Dimensi gambar maksimal 4096 × 4096 piksel.";
  }
  return null;
}

export const fileSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
