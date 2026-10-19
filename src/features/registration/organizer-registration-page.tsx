"use client";
import { useRef, useState, type FormEvent } from "react";
import type { FormFieldType, Registrant, RegistrationForm } from "@/contracts/participation";
import { ApiError, errorMessage } from "@/lib/api-client";
import { downloadXlsx, exportTime, fileSlug } from "@/lib/export";
import { focusFirstError, CheckboxField, SelectField, TextAreaField, TextField } from "@/lib/form/fields";
import { formatPrice } from "@/lib/money";
import { useResource } from "@/lib/use-resource";
import { Badge, Breadcrumb, DataTable, EmptyState, Notice, PageHeader, ProtectedPage, SkeletonCards, StatGrid, TabPanel, Tabs, uiStyles, useTabsId, useToast, type Column } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { RegistrantReview } from "./registrant-review";
import { statusLabel, statusTone } from "./registration-status";
import { getOwnRegistrationForm, getRegistrants, saveRegistrationForm } from "./services/registration-service";
import styles from "./organizer-registration.module.css";

const typeLabel: Record<FormFieldType, string> = { text: "Teks singkat", longtext: "Teks panjang", choice: "Pilihan", image: "Unggah gambar" };
const typeOptions = (Object.keys(typeLabel) as FormFieldType[]).map((value) => ({ value, label: typeLabel[value] }));
const loadForm = (id: string, signal: AbortSignal) => getOwnRegistrationForm(id, signal);
const loadRegistrants = (id: string, signal: AbortSignal) => getRegistrants(id, signal);

/** Organizer page for one event: the registrants, and the price and questions people answer when they register. */
export default function OrganizerRegistrationPage({ id }: { id: string }) { return <ProtectedPage><Page id={id} /></ProtectedPage>; }

function Page({ id }: { id: string }) {
  const board = useResource(id, loadRegistrants);
  const form = useResource(id, loadForm);
  const base = useTabsId();
  const [tab, setTab] = useState("peserta");
  if (board.status === "loading" || form.status === "loading") return <SkeletonCards label="Memuat pendaftaran…" count={2} />;
  if (board.status === "error" || form.status === "error") return <Notice error>{errorMessage(board.error ?? form.error)} <button type="button" className={uiStyles.secondary} onClick={() => { board.reload(); form.reload(); }}>Coba lagi</button></Notice>;
  if (!board.data || !form.data) return null;
  const active = board.data.items.filter((item) => item.status === "REGISTERED");
  const pending = board.data.items.filter((item) => item.status === "PENDING");
  return <>
    <Breadcrumb href={`/events/${id}`} parent={board.data.eventTitle} current="Pendaftaran" />
    <PageHeader title="Pendaftaran peserta." action={<ExportButton title={board.data.eventTitle} items={board.data.items} />}>Lihat siapa yang mendaftar, atur harga tiket, dan tentukan pertanyaan yang harus diisi peserta.</PageHeader>
    <StatGrid label="Ringkasan pendaftaran" items={[{ label: "peserta terdaftar", value: active.length }, ...(board.data.priceIdr > 0 || pending.length ? [{ label: "menunggu konfirmasi", value: pending.length }] : []), ...(board.data.qrEnabled ? [{ label: "QR terkirim", value: active.filter((item) => item.qrIssued).length }] : [])]} />
    <Tabs idBase={base} label="Bagian pendaftaran" value={tab} onChange={setTab} items={[{ key: "peserta", label: "Peserta" }, { key: "hadir", label: "Hadir" }, { key: "form", label: "Harga dan form" }]} />
    <TabPanel idBase={base} value={tab}>
      {tab === "hadir" && !board.data.items.some((item) => item.checkedInAt) ? <EmptyState title="Belum ada peserta hadir.">Kehadiran muncul setelah panitia memindai tiket, jika presensi QR diaktifkan.</EmptyState> : tab !== "form" ? <Registrants eventId={id} items={tab === "hadir" ? board.data.items.filter((item) => item.checkedInAt) : board.data.items} price={board.data.priceIdr} onChanged={board.reload} />
        : <FormEditor id={id} form={form.data} onSaved={() => { form.reload(); board.reload(); }} />}
    </TabPanel>
  </>;
}

function ExportButton({ title, items }: { title: string; items: Registrant[] }) {
  const toast = useToast();
  function run() {
    const labels = [...new Set(items.flatMap((item) => item.answers.map((answer) => answer.label)))];
    const answer = (item: Registrant, label: string) => {
      const value = item.answers.find((entry) => entry.label === label)?.value ?? "";
      return value.startsWith("data:") ? "Gambar diunggah (lihat di PartnerHub)" : value;
    };
    downloadXlsx(`peserta-${fileSlug(title)}.xlsx`, [{ name: "Peserta", rows: [
       ["No", "Nama", "Referensi tiket", "Status", "Waktu daftar", "QR terkirim", "Waktu hadir", ...labels],
      ...items.map((item, index) => [index + 1, item.name, item.ticketReference, statusLabel[item.status], exportTime(item.createdAt), item.qrIssued ? "Ya" : "Belum", item.checkedInAt ? exportTime(item.checkedInAt) : "Belum hadir", ...labels.map((label) => answer(item, label))]),
    ] }]);
    toast(`${items.length} peserta diekspor ke Excel.`);
  }
  return <button type="button" className={uiStyles.secondary} onClick={run} disabled={!items.length}><Icon name="download" size={18} />Ekspor Excel</button>;
}

function Registrants({ eventId, items, price, onChanged }: { eventId: string; items: Registrant[]; price: number; onChanged: () => void }) {
  const [reviewId, setReviewId] = useState<string | null>(null);
  const reviewing = items.find((item) => item.id === reviewId);
  const columns: readonly Column<Registrant>[] = [
    { key: "name", header: "Nama", sortValue: (row) => row.name, render: (row) => <strong>{row.name}</strong> },
    { key: "ref", header: "Referensi tiket", render: (row) => <span className={styles.mono}>{row.ticketReference}</span> },
    { key: "status", header: "Status", sortValue: (row) => row.status, render: (row) => <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge> },
    { key: "when", header: "Waktu daftar", sortValue: (row) => row.createdAt, render: (row) => exportTime(row.createdAt) },
    { key: "qr", header: "QR", sortValue: (row) => Number(row.qrIssued), render: (row) => row.qrIssued ? "Terkirim" : "Belum" },
    { key: "attendance", header: "Kehadiran", render: (row) => row.checkedInAt ? <span>Hadir · {exportTime(row.checkedInAt)}</span> : "Belum hadir" },
    { key: "review", header: "Bukti dan jawaban", render: (row) => row.answers.length || row.status === "PENDING"
      ? <button type="button" className={row.status === "PENDING" ? uiStyles.primary : uiStyles.secondary} aria-haspopup="dialog" aria-label={`${row.status === "PENDING" ? "Tinjau" : "Lihat"} pendaftaran ${row.name}`} onClick={() => setReviewId(row.id)}>{row.status === "PENDING" ? "Tinjau" : "Lihat"}</button>
      : <span className={styles.muted}>Tidak ada</span> },
  ];
  if (!items.length) return <EmptyState title="Belum ada peserta.">Peserta muncul di sini setelah mereka mendaftar lewat form acaramu.</EmptyState>;
  return <>
    <p className={styles.muted}>Harga tiket saat ini {formatPrice(price)}. Hanya nama tampilan yang dibagikan, email dan nomor telepon peserta tidak.</p>
    <DataTable caption="Peserta acara" columns={columns} rows={items} rowKey={(row) => row.id} />
    {reviewing && <RegistrantReview key={reviewing.id} eventId={eventId} item={reviewing} onClose={() => setReviewId(null)} onChanged={onChanged} />}
  </>;
}

type Draft = { key: number; id: string | null; label: string; type: FormFieldType; required: boolean; hint: string; options: string };
let draftKey = 0;
const toDraft = (field: RegistrationForm["fields"][number]): Draft => ({ key: ++draftKey, id: field.id, label: field.label, type: field.type, required: field.required, hint: field.hint ?? "", options: field.options.join(", ") });

function FormEditor({ id, form, onSaved }: { id: string; form: RegistrationForm; onSaved: () => void }) {
  const [price, setPrice] = useState(String(form.priceIdr));
  const [note, setNote] = useState(form.paymentNote ?? "");
  const [fields, setFields] = useState<Draft[]>(() => form.fields.map(toDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const element = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const amount = Number(price.replace(/\./g, ""));
  const update = (key: number, patch: Partial<Draft>) => { setFields(fields.map((field) => field.key === key ? { ...field, ...patch } : field)); setErrors({}); };
  const move = (index: number, by: -1 | 1) => { const next = [...fields]; [next[index], next[index + by]] = [next[index + by], next[index]]; setFields(next); };
  const order = ["priceIdr", "paymentNote", ...fields.map((_, index) => `field${index}`), "fields"];

  async function submit(submitted: FormEvent<HTMLFormElement>) {
    submitted.preventDefault();
    if (busy) return;
    const found: Record<string, string> = {};
    if (!/^\d{1,8}$/.test(price.replace(/\./g, "")) || amount > 10_000_000) found.priceIdr = "Isi harga 0 sampai 10.000.000, angka saja. Isi 0 untuk acara gratis.";
    if (amount > 0 && note.trim().length < 10) found.paymentNote = "Jelaskan cara membayar, minimal 10 karakter.";
    fields.forEach((field, index) => {
      if (field.label.trim().length < 3) found[`field${index}`] = "Tulis pertanyaan, minimal 3 karakter.";
      else if (field.type === "choice" && field.options.split(",").map((option) => option.trim()).filter(Boolean).length < 2) found[`field${index}`] = "Isi minimal 2 pilihan, pisahkan dengan koma.";
    });
    if (amount > 0 && !fields.some((field) => field.type === "image")) found.fields = "Acara berbayar perlu satu pertanyaan Unggah gambar untuk bukti pembayaran.";
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(element.current, order.filter((key) => found[key]), found); return; }
    setBusy(true); setFailure("");
    try {
      await saveRegistrationForm(id, { priceIdr: amount, paymentNote: note.trim() || null, fields: fields.map((field) => ({ id: field.id, label: field.label.trim(), type: field.type, required: field.required, hint: field.hint.trim() || null, options: field.type === "choice" ? field.options.split(",").map((option) => option.trim()).filter(Boolean) : [] })) });
      toast("Harga dan form pendaftaran disimpan.");
      onSaved();
    } catch (error) {
      setFailure(errorMessage(error));
      if (error instanceof ApiError && Object.keys(error.fields).length) { setErrors(error.fields); focusFirstError(element.current, order, error.fields); }
    } finally { setBusy(false); }
  }

  return <form ref={element} className={`${uiStyles.form} ${styles.editor}`} onSubmit={submit} noValidate>
    {form.isDefault && <Notice>Acara ini belum punya form sendiri. Peserta sekarang melihat satu pertanyaan bawaan dan tiket gratis.</Notice>}
    <section className={styles.block} aria-labelledby="price-title">
      <h2 id="price-title">Harga tiket</h2>
      <TextField name="priceIdr" label="Harga (Rp)" inputMode="numeric" value={price} onChange={(value) => { setPrice(value.replace(/[^\d.]/g, "")); setErrors({}); }} maxLength={10} error={errors.priceIdr} hint="Isi 0 untuk acara gratis. PartnerHub hanya menampilkan harga dan tidak memproses pembayaran." disabled={busy} />
      {amount > 0 && <TextAreaField name="paymentNote" label="Cara membayar" value={note} onChange={(value) => { setNote(value); setErrors({}); }} maxLength={400} rows={3} error={errors.paymentNote} hint="Peserta membaca ini sebelum mendaftar, misalnya rekening atau kontak panitia." disabled={busy} />}
      <p className={styles.preview}>Peserta akan melihat: <strong>{formatPrice(Number.isFinite(amount) ? amount : 0)}</strong></p>
    </section>
    <section className={styles.block} aria-labelledby="fields-title" data-field="fields">
      <h2 id="fields-title">Pertanyaan pendaftaran</h2>
      <p className={styles.muted}>Peserta mengisi ini saat mendaftar. Maksimal 10 pertanyaan. Jangan minta data yang tidak kamu perlukan.</p>
      {errors.fields && <p className={uiStyles.fieldError} role="alert">{errors.fields}</p>}
      <ul className={styles.fields}>{fields.map((field, index) => <li key={field.key}>
        <div className={styles.fieldHead}><strong>Pertanyaan {index + 1}</strong>
          <span className={styles.actions}>
            <button type="button" className={uiStyles.secondary} onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={`Naikkan pertanyaan ${index + 1}`}>Naik</button>
            <button type="button" className={uiStyles.secondary} onClick={() => move(index, 1)} disabled={busy || index === fields.length - 1} aria-label={`Turunkan pertanyaan ${index + 1}`}>Turun</button>
            <button type="button" className={uiStyles.secondary} onClick={() => setFields(fields.filter((item) => item.key !== field.key))} disabled={busy} aria-label={`Hapus pertanyaan ${index + 1}`}>Hapus</button>
          </span></div>
        <div className={styles.row}>
          <TextField name={`field${index}`} label="Pertanyaan" value={field.label} onChange={(value) => update(field.key, { label: value })} maxLength={100} error={errors[`field${index}`]} disabled={busy} />
          <SelectField name={`type${index}`} label="Jenis isian" value={field.type} onChange={(value) => update(field.key, { type: value as FormFieldType })} options={typeOptions} placeholder="Pilih jenis" disabled={busy} />
        </div>
        {field.type === "choice" && <TextField name={`options${index}`} label="Pilihan" value={field.options} onChange={(value) => update(field.key, { options: value })} maxLength={400} hint="Pisahkan dengan koma, misalnya Pemula, Menengah, Mahir." disabled={busy} />}
        <TextField name={`hint${index}`} label="Petunjuk" optional value={field.hint} onChange={(value) => update(field.key, { hint: value })} maxLength={200} disabled={busy} />
        <CheckboxField name={`required${index}`} checked={field.required} onChange={(checked) => update(field.key, { required: checked })} disabled={busy}>Wajib diisi</CheckboxField>
      </li>)}</ul>
      {fields.length < 10 && <button type="button" className={uiStyles.secondary} onClick={() => setFields([...fields, { key: ++draftKey, id: null, label: "", type: "text", required: false, hint: "", options: "" }])} disabled={busy}>Tambah pertanyaan</button>}
    </section>
    {failure && <Notice error>{failure}</Notice>}
    <div className={styles.actions}><button className={uiStyles.primary} disabled={busy}>{busy ? "Menyimpan…" : "Simpan harga dan form"}</button></div>
  </form>;
}
