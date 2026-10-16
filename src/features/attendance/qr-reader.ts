import jsQR from "jsqr";

export function readQr(canvas: HTMLCanvasElement): string | null {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !canvas.width || !canvas.height) return null;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

export async function readQrFile(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 10_000_000) throw new Error("Pilih gambar PNG, JPG, atau WebP, maksimal 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); } catch { throw new Error("Gambar rusak atau tidak dapat dibaca. Pilih gambar QR lain."); }
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const payload = readQr(canvas);
    if (!payload) throw new Error("QR tidak terbaca. Pilih gambar yang jelas dan menampilkan seluruh kode.");
    return payload;
  } finally { URL.revokeObjectURL(url); }
}
