import { draftStorageKey, parseStoredDraft, type EventDraft } from "./draft";
import {
  emptyBranding,
  isBranding,
  validateLogo,
  type EventBranding,
} from "./event-branding";

type LocalDraft = { version: 2; draft: EventDraft; branding: EventBranding };
const databaseName = "partnerhub-event-drafts";

async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(
        new Error(
          "Penyimpanan sedang dipakai tab lain. Tutup tab PartnerHub lain lalu coba lagi.",
        ),
      );
  });
}

async function access(
  action: "get" | "put" | "delete",
  value?: LocalDraft,
): Promise<unknown> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        "drafts",
        action === "get" ? "readonly" : "readwrite",
      );
      const store = transaction.objectStore("drafts");
      const request =
        action === "get"
          ? store.get("current")
          : action === "put"
            ? store.put(value, "current")
            : store.delete("current");
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error || new Error("Penyimpanan dibatalkan."));
    });
  } finally {
    db.close();
  }
}

export async function saveLocalDraft(
  draft: EventDraft,
  branding: EventBranding,
) {
  await access("put", { version: 2, draft, branding });
}

export async function restoreLocalDraft(): Promise<{
  draft: EventDraft;
  branding: EventBranding;
} | null> {
  const value = (await access("get")) as LocalDraft | undefined;
  if (!value) {
    const legacy = localStorage.getItem(draftStorageKey);
    if (!legacy) return null;
    const draft = parseStoredDraft(legacy);
    if (!draft)
      throw new Error(
        "Draft tersimpan tidak valid. Isian saat ini tidak diubah.",
      );
    return { draft, branding: emptyBranding() };
  }
  const draft =
    value.version === 2
      ? parseStoredDraft(JSON.stringify({ version: 1, draft: value.draft }))
      : null;
  if (!draft || !isBranding(value.branding))
    throw new Error(
      "Draft tersimpan tidak valid. Isian saat ini tidak diubah.",
    );
  const assets = [
    value.branding.eventLogo,
    value.branding.organizationLogo,
    ...value.branding.sponsors.map((sponsor) => sponsor.logo),
  ].filter((asset) => asset !== null);
  await Promise.all(assets.map((asset) => "file" in asset ? validateLogo(asset.file) : Promise.reject(new Error("Draft lokal tidak valid."))));
  return { draft, branding: value.branding };
}

export async function deleteLocalDraft() {
  localStorage.removeItem(draftStorageKey);
  await access("delete");
}
