"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { focusFirstError, TextAreaField, TextField } from "@/lib/form/fields";
import { Badge, Breadcrumb, Notice, PageHeader, ProtectedPage, SelectionSteps, SkeletonCards, uiStyles, useToast } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import type { CommitteeWorkspace } from "@/contracts/committee";
import { getCommitteeWorkspace, saveOpening } from "./services/committee-service";
import styles from "./committee.module.css";

export default function CommitteeManagePage({ id }: { id: string }) { return <ProtectedPage><Manage id={id} /></ProtectedPage>; }

function Manage({ id }: { id: string }) {
  const resource = useResource(id, getCommitteeWorkspace);
  if (resource.status === "loading") return <SkeletonCards label="Memuat data panitia…" count={2} />;
  if (resource.status === "error") return <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button> <Link href="/organizer">Ke workspace</Link></Notice>;
  if (!resource.data) return null;
  return <Loaded id={id} data={resource.data} reload={resource.reload} />;
}

function Loaded({ id, data, reload }: { id: string; data: CommitteeWorkspace; reload: () => void }) {
  const toast = useToast();
  const count = (test: (item: CommitteeWorkspace["applications"][number]) => boolean) => data.applications.filter(test).length;
  const views = [
    { href: `/events/${id}/committee/pelamar`, label: "Lihat pelamar", hint: "Semua lamaran yang masuk", value: data.applications.length },
    { href: `/events/${id}/committee/seleksi`, label: "Lihat yang dalam seleksi", hint: "Sedang di salah satu tahapan", value: count((item) => item.status === "IN_SELECTION") },
    { href: `/events/${id}/committee/diterima`, label: "Lihat yang diterima", hint: "Sudah menerima langkah berikutnya", value: count((item) => item.status === "ACCEPTED") },
  ];
  return <>
    <Breadcrumb href={`/events/${id}`} parent={data.eventTitle} current="Panitia" />
    <PageHeader title="Rekrut panitia.">Buka lowongan dan atur tahapan seleksi di sini. Pelamar dibaca dan diproses di layar terpisah.</PageHeader>
    <ul className={styles.entryGrid} aria-label="Daftar pelamar">{views.map((view) => <li key={view.href}>
      <Link className={styles.entry} href={view.href}><strong>{view.value}</strong><span className={styles.entryLabel}>{view.label}<Icon name="arrow" size={18} /></span><span className={styles.muted}>{view.hint}</span></Link>
    </li>)}</ul>
    {!data.eventPublished && <Notice>Lowongan hanya bisa dibuka untuk acara yang terpublikasi. Publikasi acara masih dalam pengembangan.</Notice>}
    {data.eventPublished && <OpeningForm key={data.opening?.id ?? "new"} id={id} data={data} onSaved={(text) => { toast(text); reload(); }} />}
  </>;
}
type StageDraft = { id: string | null; name: string; key: number };
// Keys only identify rows while editing. They are never sent anywhere, so a module counter is enough.
let stageKey = 0;
const draft = (stage: { id: string | null; name: string }): StageDraft => ({ ...stage, key: ++stageKey });

function OpeningForm({ id, data, onSaved }: { id: string; data: CommitteeWorkspace; onSaved: (text: string) => void }) {
  const opening = data.opening;
  const [values, setValues] = useState(() => ({ description: opening?.description ?? "", divisions: opening?.divisions.map((item) => item.name) ?? [""], question: opening?.question ?? "" }));
  const [stages, setStages] = useState<StageDraft[]>(() => (opening?.stages ?? [{ id: null, name: "Daftar pendek" }, { id: null, name: "Wawancara" }]).map(draft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const setDivision = (index: number, value: string) => { setValues({ ...values, divisions: values.divisions.map((name, position) => position === index ? value : name) }); setErrors({ ...errors, divisions: "" }); };
  const setStage = (key: number, name: string) => { setStages(stages.map((stage) => stage.key === key ? { ...stage, name } : stage)); setErrors({ ...errors, stages: "" }); };
  const moveStage = (index: number, by: -1 | 1) => { const next = [...stages]; const target = index + by; [next[index], next[target]] = [next[target], next[index]]; setStages(next); };
  async function submit(open: boolean) {
    if (busy) return;
    const names = values.divisions.map((name) => name.trim()).filter(Boolean);
    const found: Record<string, string> = {};
    if (values.description.trim().length < 20) found.description = "Jelaskan kebutuhan panitia, minimal 20 karakter.";
    if (!names.length) found.divisions = "Isi minimal satu divisi.";
    else if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) found.divisions = "Nama divisi tidak boleh sama.";
    const stageNames = stages.map((stage) => stage.name.trim());
    if (stageNames.some((name) => !name)) found.stages = "Beri setiap tahapan nama, atau hapus yang kosong.";
    else if (new Set(stageNames.map((name) => name.toLowerCase())).size !== stageNames.length) found.stages = "Nama tahapan tidak boleh sama.";
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(form.current, ["description", "divisions0", "stage0", "question"], { ...found, divisions0: found.divisions ?? "", stage0: found.stages ?? "" }); return; }
    setBusy(true); setMessage(null);
    try { await saveOpening(id, { description: values.description.trim(), divisions: names, question: values.question.trim() || null, stages: stages.map((stage) => ({ id: stage.id, name: stage.name.trim() })), open }); onSaved(open ? "Lowongan dibuka dan tampil untuk user." : "Lowongan ditutup. Lamaran yang masuk tetap bisa diproses."); }
    catch (error) {
      setMessage({ error: true, text: errorMessage(error) });
      if (error instanceof ApiError && Object.keys(error.fields).length) { setErrors(error.fields); focusFirstError(form.current, ["description", "divisions0", "stage0", "question"], { ...error.fields, divisions0: error.fields.divisions ?? "", stage0: error.fields.stages ?? "" }); }
    } finally { setBusy(false); }
  }
  const onSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void submit(true); };
  return <section className={`${styles.section} ${styles.formCard}`} aria-labelledby="opening-title">
    <div className={styles.row}><h2 id="opening-title">Lowongan</h2>{opening && <Badge tone={opening.status === "OPEN" ? "success" : "neutral"}>{opening.status === "OPEN" ? "Dibuka" : "Ditutup"}</Badge>}</div>
    <form ref={form} className={uiStyles.form} onSubmit={onSubmit} noValidate>
      <TextAreaField name="description" label="Kebutuhan panitia" value={values.description} onChange={(description) => { setValues({ ...values, description }); setErrors({ ...errors, description: "" }); }} maxLength={1000} error={errors.description} hint="Jelaskan peran, waktu kerja, dan siapa yang cocok. Minimal 20 karakter." disabled={busy} />
      <div className={styles.divisions} data-field="divisions">
        <p className={styles.groupLabel}>Divisi yang dibuka</p>
        <ul className={styles.divisionList}>{values.divisions.map((name, index) => <li key={index}>
          <div><TextField name={`divisions${index}`} label={`Divisi ${index + 1}`} value={name} onChange={(value) => setDivision(index, value)} maxLength={60} disabled={busy} error={index === 0 ? errors.divisions : undefined} /></div>
          {values.divisions.length > 1 && <button type="button" className={uiStyles.secondary} onClick={() => setValues({ ...values, divisions: values.divisions.filter((_, position) => position !== index) })} disabled={busy} aria-label={`Hapus divisi ${index + 1}`}>Hapus</button>}
        </li>)}</ul>
        {values.divisions.length < 12 && <button type="button" className={uiStyles.secondary} onClick={() => setValues({ ...values, divisions: [...values.divisions, ""] })} disabled={busy}>Tambah divisi</button>}
      </div>
      <div className={styles.divisions} data-field="stages">
        <p className={styles.groupLabel}>Tahapan seleksi</p>
        <p className={styles.note}>Pelamar selalu mulai di &ldquo;Lamaran masuk&rdquo; dan berakhir di &ldquo;Diterima&rdquo;. Atur tahapan di antaranya sesuai acaramu, maksimal 5.</p>
        <SelectionSteps label="Pratinjau alur seleksi" steps={[{ key: "in", label: "Lamaran masuk", state: "done" }, ...stages.map((stage, index) => ({ key: `p${stage.key}`, label: stage.name.trim() || `Tahap ${index + 1}`, state: "waiting" as const })), { key: "out", label: "Diterima", state: "waiting" as const }]} />
        <ul className={styles.divisionList}>{stages.map((stage, index) => <li key={stage.key}>
          <div><TextField name={`stage${index}`} label={`Tahap ${index + 1}`} value={stage.name} onChange={(value) => setStage(stage.key, value)} maxLength={40} disabled={busy} error={index === 0 ? errors.stages : undefined} /></div>
          <div className={styles.stageActions}>
            <button type="button" className={uiStyles.secondary} onClick={() => moveStage(index, -1)} disabled={busy || index === 0} aria-label={`Naikkan tahap ${index + 1}`}>Naik</button>
            <button type="button" className={uiStyles.secondary} onClick={() => moveStage(index, 1)} disabled={busy || index === stages.length - 1} aria-label={`Turunkan tahap ${index + 1}`}>Turun</button>
            <button type="button" className={uiStyles.secondary} onClick={() => setStages(stages.filter((item) => item.key !== stage.key))} disabled={busy} aria-label={`Hapus tahap ${index + 1}`}>Hapus</button>
          </div>
        </li>)}</ul>
        {errors.stages && stages.length === 0 && <p className={styles.fieldError} role="alert">{errors.stages}</p>}
        {stages.length < 5 && <button type="button" className={uiStyles.secondary} onClick={() => setStages([...stages, draft({ id: null, name: "" })])} disabled={busy}>Tambah tahap</button>}
      </div>
      <TextField name="question" label="Pertanyaan untuk pelamar" optional value={values.question} onChange={(question) => setValues({ ...values, question })} maxLength={200} hint="Satu pertanyaan khusus acara ini, misalnya pengalaman kepanitiaan." disabled={busy} />
      {message && <Notice error={message.error}>{message.text}</Notice>}
      <div className={styles.decideActions}>
        <button className={uiStyles.primary} disabled={busy}>{busy ? "Menyimpan…" : opening?.status === "OPEN" ? "Simpan perubahan" : "Buka lowongan"}</button>
        {opening?.status === "OPEN" && <button type="button" className={uiStyles.secondary} onClick={() => void submit(false)} disabled={busy}>Tutup lowongan</button>}
      </div>
    </form>
  </section>;
}
