export const logoMaxBytes = 2 * 1024 * 1024;
export const sponsorLimit = 6;
export const logoTypes = ["image/png", "image/jpeg", "image/webp"];

export type LogoAsset = { file: Blob; name: string } | { remote: import("@/contracts/event").Asset; name: string };
export type EventBranding = {
  organizationName: string;
  eventLogo: LogoAsset | null;
  organizationLogo: LogoAsset | null;
  sponsors: { id: string; name: string; logo: LogoAsset | null }[];
};

export function emptyBranding(): EventBranding {
  return {
    organizationName: "",
    eventLogo: null,
    organizationLogo: null,
    sponsors: [],
  };
}

export function logoFileError(file: Blob): string | null {
  if (!logoTypes.includes(file.type))
    return "Gunakan PNG, JPG, atau WebP. SVG dan GIF tidak didukung.";
  if (!file.size) return "File kosong. Pilih gambar yang lain.";
  if (file.size > logoMaxBytes)
    return "Ukuran gambar maksimal 2 MB. Kecilkan file lalu coba lagi.";
  return null;
}

export async function validateLogo(file: Blob): Promise<void> {
  const error = logoFileError(file);
  if (error) throw new Error(error);
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Gambar tidak bisa dibaca. Pilih file gambar yang valid.");
  });
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  if (width > 4096 || height > 4096)
    throw new Error("Dimensi gambar maksimal 4096 × 4096 piksel.");
}

export function brandingError(branding: EventBranding): string | null {
  if (branding.organizationName.length > 100)
    return "Nama organisasi maksimal 100 karakter.";
  if (branding.organizationLogo && !branding.organizationName.trim())
    return "Isi nama organisasi untuk logo penyelenggara.";
  if (branding.sponsors.length > sponsorLimit)
    return "Maksimal 6 sponsor di halaman event.";
  if (
    branding.sponsors.some(
      (sponsor) => !sponsor.name.trim() || sponsor.name.length > 100,
    )
  )
    return "Isi nama setiap sponsor, maksimal 100 karakter, atau hapus baris yang tidak digunakan.";
  return null;
}

export function isBranding(value: unknown): value is EventBranding {
  if (!value || typeof value !== "object") return false;
  const branding = value as EventBranding;
  const isLogo = (asset: LogoAsset | null) =>
    asset === null ||
    (asset &&
      typeof asset.name === "string" &&
      asset.name.length <= 255 &&
      "file" in asset && asset.file instanceof Blob &&
      !logoFileError(asset.file));
  return (
    typeof branding.organizationName === "string" &&
    Array.isArray(branding.sponsors) &&
    Boolean(isLogo(branding.eventLogo)) &&
    Boolean(isLogo(branding.organizationLogo)) &&
    branding.sponsors.every(
      (sponsor) =>
        sponsor &&
        typeof sponsor.id === "string" &&
        typeof sponsor.name === "string" &&
        isLogo(sponsor.logo),
    ) &&
    new Set(branding.sponsors.map((sponsor) => sponsor.id)).size ===
      branding.sponsors.length &&
    !brandingError(branding)
  );
}
