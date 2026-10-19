"use client";

import { useRef, useState, type FormEvent } from "react";
import type { MatchingField } from "@/contracts/matching";
import {
  initialDraft,
  validateDraftStep,
  type DraftErrors,
  type EventDraft,
} from "./draft";
import styles from "./event-draft.module.css";
import { ApiError, errorMessage } from "@/lib/api-client";
import { useUnsavedChanges } from "./use-unsaved-changes";
import EventPreview from "./event-preview";
import EventFields from "./event-fields";
import EventBrandingFields from "./event-branding-fields";
import {
  brandingError,
  emptyBranding,
  type EventBranding,
} from "./event-branding";

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

export default function EventDraftBuilder({ initial, onSave, children, saveLabel = "Buat acara", extraDirty = false, fieldsLocked = false }: {
  initial?: { draft: EventDraft; branding: EventBranding };
  onSave: (draft: EventDraft, branding: EventBranding) => Promise<void>;
  children?: import("react").ReactNode;
  saveLabel?: string;
  extraDirty?: boolean;
  fieldsLocked?: boolean;
}) {
  const [draft, setDraft] = useState<EventDraft>(initial?.draft || initialDraft);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [branding, setBranding] = useState<EventBranding>(initial?.branding || emptyBranding());
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty || extraDirty);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"poster" | "page">("poster");
  const form = useRef<HTMLFormElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);

  function update(field: keyof Omit<EventDraft, "modules">, value: string | MatchingField[]) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setNotice("");
    setSaved(false);
    setDirty(true);
  }

  function moveTo(next: number) {
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => stepHeading.current?.focus());
  }

  function updateBranding(next: EventBranding) {
    setBranding(next);
    setSaved(false);
    setDirty(true);
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (form.current?.querySelector('[aria-busy="true"]')) {
      setNotice("Tunggu pemeriksaan gambar selesai sebelum melanjutkan.");
      return;
    }
    const nextErrors = validateDraftStep(draft, step >= 2 ? 2 : step, fieldsLocked);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice("Lengkapi detail yang ditandai sebelum melanjutkan.");
      if (nextErrors.title || nextErrors.summary || nextErrors.matchingFields) setStep(0);
      else setStep(1);
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setNotice("");
    if (step >= 2 && brandingError(branding)) {
      setNotice(brandingError(branding)!);
      moveTo(2);
      return;
    }
    if (step < 3) {
      moveTo(step + 1);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft, branding);
      setSaved(true);
      setDirty(false);
      setNotice("Acara tersimpan.");
    } catch (error) {
      setSaved(false);
      if (error instanceof ApiError && Object.keys(error.fields).length) {
        setErrors(error.fields);
        setStep(error.fields.title || error.fields.summary || error.fields.matchingFields ? 0 : 1);
        requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      }
      setNotice(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.builder}>
      <div className={styles.layout}>
        <div className={styles.formColumn}>
          <ol className={styles.steps} aria-label="Langkah membuat acara">
            {stepLabels.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => moveTo(index)}
                  disabled={saving}
                  aria-current={step === index ? "step" : undefined}
                >
                  <span>{index + 1}</span>
                  {label}
                </button>
              </li>
            ))}
          </ol>
          <form ref={form} onSubmit={submit} noValidate>
            <fieldset disabled={saving} className={styles.formFieldset}>
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
                        : "Selesai disusun? Acara masuk Arsip acara. Pembayaran diperiksa saat kamu ingin mengunggahnya."}
                </p>
              </div>
              {step < 2 && <EventFields draft={draft} errors={errors} step={step} update={update} fieldsLocked={fieldsLocked}/>}
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
                           setDirty(true);
                          setNotice("");
                        }}
                      />
                    </label>
                  ))}
                  <p className={styles.hint}>
                    Pengaturan disimpan bersama acara. Presensi lanjutan tersedia pada halaman Presensi setelah acara dibuat.
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
                  disabled={saving}
                >
                  {saving
                    ? "Memproses…"
                    : step === 3
                      ? saveLabel
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
            <EventPreview draft={draft} branding={branding} saved={saved && !extraDirty}/>
          </div>
        </aside>
      </div>
    </div>
  );
}
