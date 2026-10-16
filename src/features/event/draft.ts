import { z } from "zod";

export const draftStorageKey = "partnerhub:event-draft:v1";

const draftSchema = z.object({
  title: z.string().max(100),
  category: z.enum(["Seminar & diskusi", "Workshop", "Kegiatan komunitas"]),
  summary: z.string().max(500),
  date: z.string().max(10),
  startTime: z.string().max(5),
  endTime: z.string().max(5),
  venue: z.string().max(150),
  capacity: z.string().max(6),
  modules: z.object({
    registration: z.boolean(),
    committee: z.boolean(),
    attendance: z.boolean(),
    sponsorship: z.boolean(),
  }),
});

export type EventDraft = z.infer<typeof draftSchema>;
export type DraftErrors = Partial<Record<keyof EventDraft, string>>;

export const initialDraft: EventDraft = {
  title: "",
  category: "Seminar & diskusi",
  summary: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  capacity: "",
  modules: {
    registration: true,
    committee: false,
    attendance: false,
    sponsorship: true,
  },
};

export function validateDraftStep(
  draft: EventDraft,
  step: number,
): DraftErrors {
  const errors: DraftErrors = {};
  if (step === 0 || step === 2) {
    if (draft.title.trim().length < 3)
      errors.title = "Isi judul event, minimal 3 karakter.";
    if (draft.title.length > 100) errors.title = "Judul maksimal 100 karakter.";
    if (draft.summary.length > 500)
      errors.summary = "Deskripsi maksimal 500 karakter.";
  }
  if (step === 1 || step === 2) {
    const parsedDate = new Date(`${draft.date}T12:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== draft.date
    )
      errors.date = "Pilih tanggal event yang valid.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime))
      errors.startTime = "Isi jam mulai yang valid.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.endTime))
      errors.endTime = "Isi jam selesai yang valid.";
    else if (draft.endTime <= draft.startTime)
      errors.endTime = "Jam selesai harus setelah jam mulai (hari yang sama).";
    if (!draft.venue.trim())
      errors.venue = "Isi lokasi atau keterangan pelaksanaan online.";
    if (
      !/^\d+$/.test(draft.capacity) ||
      Number(draft.capacity) < 1 ||
      Number(draft.capacity) > 100000
    )
      errors.capacity = "Kapasitas harus bilangan bulat, antara 1 dan 100.000.";
    if (draft.modules.attendance && !draft.modules.registration)
      errors.modules =
        "Scan kehadiran memerlukan registrasi peserta untuk tiket.";
  }
  return errors;
}

export function parseStoredDraft(value: string | null): EventDraft | null {
  if (!value || value.length > 10000) return null;
  try {
    const result = z
      .object({ version: z.literal(1), draft: draftSchema })
      .safeParse(JSON.parse(value));
    if (
      !result.success ||
      Object.keys(validateDraftStep(result.data.draft, 2)).length
    )
      return null;
    return result.data.draft;
  } catch {
    return null;
  }
}
