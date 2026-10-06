"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  initialDraft,
  validateDraftStep,
  type DraftErrors,
  type EventDraft,
} from "./draft";
import styles from "./event-draft.module.css";
import { ApiError, errorMessage } from "@/lib/api-client";
import { validatePartialDraft } from "./editor-model";
import { useUnsavedChanges } from "./use-unsaved-changes";
import EventPreview from "./event-preview";
import EventFields from "./event-fields";
import EventBrandingFields from "./event-branding-fields";
import {
  brandingError,
  emptyBranding,
  type EventBranding,
} from "./event-branding";
import {
  deleteLocalDraft,
  restoreLocalDraft,
  saveLocalDraft,
} from "./local-draft";

const stepLabels = [
  "Ide & cerita",
  "Waktu & tempat",
  "Logo & identitas",
  "Modul event",
];
const moduleOptions = [
  {
    key: "registration",
    title: "Registrasi peserta",
    description: "Form khusus event dan tiket QR tanpa data pribadi.",
    mark: "R",
  },
  {
    key: "committee",
    title: "Rekrutmen panitia",
    description: "Divisi, pilihan pelamar, dan proses seleksi.",
    mark: "P",
  },
  {
    key: "attendance",
    title: "Scan masuk",
    description: "Kehadiran sekali per tiket. Memerlukan registrasi.",
    mark: "K",
  },
  {
    key: "sponsorship",
    title: "Sponsorship",
    description: "Prospek, komitmen benefit, dan bukti pemenuhan.",
    mark: "S",
  },
] as const;

export default function EventDraftBuilder({ initial, onSave, children, onDirty, allowLocal = true, extraDirty = false }: {
  initial?: { draft: EventDraft; branding: EventBranding };
  onSave?: (draft: EventDraft, branding: EventBranding) => Promise<void>;
  children?: import("react").ReactNode;
  onDirty?: () => void;
  allowLocal?: boolean;
  extraDirty?: boolean;
}) {
  const [draft, setDraft] = useState<EventDraft>(initial?.draft || initialDraft);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(3);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [branding, setBranding] = useState<EventBranding>(initial?.branding || emptyBranding());
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty || extraDirty);
  const [storageBusy, setStorageBusy] = useState(false);
  const [previewMode, setPreviewMode] = useState<"poster" | "page">("poster");
  const form = useRef<HTMLFormElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);

  function update(field: keyof Omit<EventDraft, "modules">, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setNotice("");
    setSaved(false);
    setDirty(true); onDirty?.();
  }

  function moveTo(next: number) {
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => stepHeading.current?.focus());
  }

  function updateBranding(next: EventBranding) {
    setBranding(next);
    setSaved(false);
    setDirty(true); onDirty?.();
    setNotice("");
  }

  async function submit(event?: FormEvent<HTMLFormElement>, saveNow = false) {
    event?.preventDefault();
    if (storageBusy) return;
    if (form.current?.querySelector('[aria-busy="true"]')) {
      setNotice("Tunggu pemeriksaan gambar selesai sebelum melanjutkan.");
      return;
    }
    const nextErrors = onSave ? validatePartialDraft(draft) : validateDraftStep(draft, step >= 2 ? 2 : step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice("Ada detail yang perlu dilengkapi. Draft kamu tetap ada.");
      if (nextErrors.title || nextErrors.summary) setStep(0);
      else setStep(1);
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setNotice("");
    if ((step >= 2 || saveNow) && brandingError(branding)) {
      setNotice(brandingError(branding)!);
      moveTo(2);
      return;
    }
    if (step < 3 && !saveNow) {
      setFurthest(Math.max(furthest, step + 1));
      moveTo(step + 1);
      return;
    }
    setStorageBusy(true);
    try {
      if (onSave) await onSave(draft, branding);
      else await saveLocalDraft(
        { ...draft, title: draft.title.trim(), venue: draft.venue.trim() },
        branding,
      );
      setSaved(true);
      setDirty(false);
      setNotice(
        onSave ? "Draft dikonfirmasi oleh server. Belum dipublikasikan." : "Draft tersimpan di browser ini. Belum dipublikasikan atau dikirim ke server.",
      );
    } catch (error) {
      setSaved(false);
      if (error instanceof ApiError && Object.keys(error.fields).length) {
        setErrors(error.fields);
        setStep(error.fields.title || error.fields.summary ? 0 : 1);
        requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      }
      setNotice(
        onSave ? errorMessage(error) : "Browser tidak mengizinkan penyimpanan lokal. Draft masih ada di halaman ini, jangan tutup dulu.",
      );
    } finally {
      setStorageBusy(false);
    }
  }

  async function restore() {
    if (storageBusy) return;
    if (
      !saved &&
      (JSON.stringify(draft) !== JSON.stringify(initialDraft) ||
        JSON.stringify(branding) !== JSON.stringify(emptyBranding())) &&
      !window.confirm(
        "Pulihkan draft tersimpan? Isian dan logo yang belum disimpan akan diganti.",
      )
    )
      return;
    setStorageBusy(true);
    try {
      const restored = await restoreLocalDraft();
      if (!restored) {
        setNotice(
          "Belum ada draft tersimpan di browser ini. Mulai dari ide kamu di bawah.",
        );
        return;
      }
      setDraft(restored.draft);
      setBranding(restored.branding);
      setStep(0);
      setFurthest(3);
      setErrors({});
      setSaved(!onSave);
      setDirty(true); onDirty?.();
      setNotice("Draft lokal dipulihkan. Kamu bisa melanjutkan mengeditnya.");
    } catch (error) {
      setNotice(
        error instanceof Error && error.message.includes("tidak valid")
          ? error.message
          : "Penyimpanan lokal tidak bisa dibaca. Isian dan logo saat ini tidak diubah.",
      );
    } finally {
      setStorageBusy(false);
    }
  }

  async function saveBrowserCopy() {
    const validation = validateDraftStep(draft, 2);
    if (Object.keys(validation).length || brandingError(branding)) {
      setNotice("Salinan lokal lama memerlukan detail dan jadwal lengkap. Gunakan simpan server untuk draft yang belum lengkap.");
      return;
    }
    setStorageBusy(true);
    try { await saveLocalDraft(draft, branding); setNotice("Salinan detail dan logo tersimpan di browser ini, bukan di server. Salinan ini mengganti draft lokal sebelumnya."); }
    catch { setNotice("Salinan lokal belum dapat disimpan. Isian tetap ada di halaman ini."); }
    finally { setStorageBusy(false); }
  }

  async function deleteStored() {
    if (storageBusy) return;
    if (
      !window.confirm(
        "Hapus draft yang tersimpan di browser ini? Isian formulir saat ini tetap ada.",
      )
    )
      return;
    setStorageBusy(true);
    try {
      await deleteLocalDraft();
      setSaved(false);
      setNotice(
        "Draft lokal dihapus dari browser. Isian formulir saat ini tidak diubah.",
      );
    } catch {
      setNotice(
        "Browser tidak mengizinkan penghapusan. Draft tersimpan belum diubah.",
      );
    } finally {
      setStorageBusy(false);
    }
  }


  return (
    <div className={styles.builder}>
      <div className={styles.builderToolbar}>
        <p>
          {onSave ? "Simpan kapan saja. Jadwal boleh menyusul." : "Detail dan logo tersimpan di browser ini."}
        </p>
        <div>
          {onSave && <button className={styles.quickSave} type="button" onClick={() => void submit(undefined, true)} disabled={storageBusy}>Simpan draft sekarang</button>}
          {allowLocal && <details className={styles.localStorage}><summary>Salinan lokal</summary><div className={styles.localActions}>
          {onSave && <button type="button" onClick={saveBrowserCopy} disabled={storageBusy}>Simpan salinan lokal</button>}
          <button type="button" onClick={restore} disabled={storageBusy}>
            Buka salinan lokal
          </button>
          <button type="button" onClick={deleteStored} disabled={storageBusy}>
            Hapus draft lokal
          </button>
          </div></details>}
        </div>
      </div>
      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <ol className={styles.steps} aria-label="Langkah menyusun draft">
            {stepLabels.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => moveTo(index)}
                  disabled={storageBusy || index > furthest}
                  aria-current={step === index ? "step" : undefined}
                >
                  <span>{index + 1}</span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
          <form ref={form} onSubmit={submit} noValidate>
            <fieldset disabled={storageBusy} className={styles.formFieldset}>
              <div className={styles.stepIntro}>
                <h2 ref={stepHeading} tabIndex={-1}>
                  {step === 0
                    ? "Apa yang ingin kamu buat?"
                    : step === 1
                      ? "Kapan dan di mana?"
                      : step === 2
                        ? "Beri eventmu identitas."
                        : "Pilih yang eventmu butuhkan."}
                </h2>
                <p>
                  {step === 0
                    ? "Beri ide kamu sebuah nama. Ceritanya bisa kamu rapikan sambil jalan."
                    : step === 1
                      ? "Jadwal menggunakan WIB, untuk event yang selesai pada hari yang sama."
                      : step === 2
                        ? "Logo milik acara, organisasi penyelenggara, dan sponsor. Semuanya kamu yang menentukan."
                        : "Konfigurasi ini masuk ke draft. Layanan registrasi, panitia, scan, dan sponsor masih In progress."}
                </p>
              </div>
              {step < 2 && <EventFields draft={draft} errors={errors} step={step} update={update} optionalSchedule={Boolean(onSave)}/>}
              {step === 1 && children}
              {step === 2 && <EventBrandingFields branding={branding} update={updateBranding}/>}
              {step === 3 && (
                <div className={styles.moduleChoices}>
                  {moduleOptions.map((module) => (
                    <label
                      key={module.key}
                      className={
                        draft.modules[module.key]
                          ? styles.selectedModule
                          : styles.moduleChoice
                      }
                    >
                      <span className={styles.moduleMark}>{module.mark}</span>
                      <span>
                        <strong>{module.title}</strong>
                        <span>{module.description}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={draft.modules[module.key]}
                        onChange={(event) => {
                          const enabled = event.target.checked;
                          setDraft((previous) => ({
                            ...previous,
                            modules: {
                              ...previous.modules,
                              [module.key]: enabled,
                              ...(module.key === "registration" && !enabled
                                ? { attendance: false }
                                : {}),
                              ...(module.key === "attendance" && enabled
                                ? { registration: true }
                                : {}),
                            },
                          }));
                           setSaved(false);
                           setDirty(true); onDirty?.();
                          setNotice("");
                        }}
                      />
                    </label>
                  ))}
                  <p className={styles.hint}>
                    Modul ini hanya konfigurasi draft. Belum mengaktifkan layanan operasional.
                  </p>
                </div>
              )}
              {notice && (
                <p
                  className={saved ? styles.success : styles.notice}
                  role="status"
                >
                  {notice}
                </p>
              )}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => moveTo(step - 1)}
                  disabled={step === 0}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className={styles.nextButton}
                  disabled={storageBusy}
                >
                  {storageBusy
                    ? "Memproses…"
                    : step === 3
                      ? onSave ? "Simpan draft ke server" : "Simpan draft lokal"
                      : "Lanjutkan"}
                  <svg
                    aria-hidden="true"
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </button>
              </div>
            </fieldset>
          </form>
        </div>
        <aside
          className={styles.previewColumn}
          aria-label="Preview event langsung"
        >
          <div className={styles.previewToolbar}>
            <div
              className={styles.previewTabs}
              role="group"
              aria-label="Tampilan preview"
            >
              <button
                type="button"
                aria-pressed={previewMode === "poster"}
                onClick={() => {
                  setPreviewMode("poster");
                  setPreviewOpen(true);
                }}
              >
                Poster
              </button>
              <button
                type="button"
                aria-pressed={previewMode === "page"}
                onClick={() => {
                  setPreviewMode("page");
                  setPreviewOpen(true);
                }}
              >
                Halaman event
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              aria-expanded={previewOpen}
            >
              {previewOpen ? "Tutup preview" : "Lihat preview"}
            </button>
          </div>
          <div
            className={`${styles.preview} ${previewOpen ? styles.previewOpen : ""} ${previewMode === "page" ? styles.pagePreview : ""}`}
          >
            <EventPreview draft={draft} branding={branding} saved={saved && !extraDirty} remote={Boolean(onSave)}/>
          </div>
        </aside>
      </div>
    </div>
  );
}
