export class ApiError extends Error {
  constructor(message: string, public status = 0, public code = "NETWORK_ERROR", public fields: Record<string, string> = {}) { super(message); this.name = "ApiError"; }
}

export type RequestOptions = { method?: string; body?: unknown; signal?: AbortSignal; auth?: boolean; headers?: Record<string, string> };

const statusMessages: Record<number, string> = {
  400: "Periksa isian yang ditandai lalu coba lagi.",
  403: "Kamu tidak memiliki akses untuk tindakan ini.",
  404: "Data atau layanan yang diminta tidak tersedia.",
  409: "Data telah berubah. Muat versi terbaru sebelum menyimpan lagi.",
  413: "File terlalu besar. Pilih file yang lebih kecil.",
  415: "Format file tidak didukung.",
  422: "Periksa isian yang ditandai lalu coba lagi.",
  429: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
};

export function messageFor(status: number, authRequired: boolean): string {
  if (status === 401) return authRequired ? "Sesi berakhir. Masuk kembali untuk melanjutkan." : "Email atau password tidak cocok. Periksa kembali isianmu.";
  return statusMessages[status] || "Layanan sedang tidak tersedia. Coba lagi sebentar.";
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // Demo builds only. NEXT_PUBLIC_PARTNERHUB_DEMO is inlined at build time, so the mock module is not shipped unless it is "1".
  if (process.env.NEXT_PUBLIC_PARTNERHUB_DEMO === "1") {
    const { demoRequest } = await import("@/mocks/demo/router");
    return demoRequest<T>(path, options);
  }
  const controller = new AbortController();
  const cancel = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) cancel();
  options.signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  try {
    const multipart = options.body instanceof FormData;
    const response = await fetch(path, {
      method: options.method || "GET", credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: { Accept: "application/json", ...(options.body !== undefined && !multipart ? { "Content-Type": "application/json" } : {}), ...options.headers },
      body: options.body === undefined ? undefined : multipart ? options.body as FormData : JSON.stringify(options.body),
    });
    if (response.status === 401 && options.auth !== false) window.dispatchEvent(new Event("partnerhub:session-expired"));
    let data: unknown = null;
    if (response.status !== 204 && response.headers.get("content-type")?.includes("application/json")) data = await response.json().catch(() => {
      if (response.ok) throw new ApiError("Respons layanan tidak dapat dibaca. Coba lagi.", response.status, "INVALID_RESPONSE");
      return null;
    });
    // Release the connection for non-JSON bodies (for example an HTML 404 when the API route does not exist).
    else await response.body?.cancel().catch(() => undefined);
    if (!response.ok) {
      const error = data && typeof data === "object" && "error" in data ? (data as { error: { code?: string; fields?: Record<string, string> } }).error : null;
      const fields = error?.fields && typeof error.fields === "object" ? Object.fromEntries(Object.entries(error.fields).filter(([, value]) => typeof value === "string")) : {};
      throw new ApiError(messageFor(response.status, options.auth !== false), response.status, typeof error?.code === "string" ? error.code : "REQUEST_FAILED", fields);
    }
    if (response.status !== 204 && data === null) throw new ApiError("Respons layanan tidak dapat dibaca. Coba lagi.", response.status, "INVALID_RESPONSE");
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw error;
    throw new ApiError(timedOut ? "Permintaan terlalu lama. Periksa koneksi lalu coba lagi." : "Tidak dapat menghubungi layanan. Periksa koneksi lalu coba lagi.", 0, timedOut ? "TIMEOUT" : "NETWORK_ERROR");
  } finally { clearTimeout(timeout); options.signal?.removeEventListener("abort", cancel); }
}

export const errorMessage = (error: unknown) => error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi tanpa menutup halaman ini.";
