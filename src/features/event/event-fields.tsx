import type { DraftErrors, EventDraft } from "./draft";
import { matchingFields, type MatchingField } from "@/contracts/matching";
import { MultiSelect } from "@/lib/form/fields";
import styles from "./event-draft.module.css";

type Field = keyof Omit<EventDraft, "modules" | "matchingFields">;
export default function EventFields({draft,errors,step,update,fieldsLocked}:{draft:EventDraft;errors:DraftErrors;step:number;update:(field:keyof Omit<EventDraft,"modules">,value:string|MatchingField[])=>void;fieldsLocked:boolean}) {
  const error=(field:Field)=>errors[field] ? <span id={`${field}-error`} className={styles.fieldError}>{errors[field]}</span> : null;
  const input=(field:Field,type="text",maxLength?:number)=><input name={field} type={type} value={draft[field]} onChange={event=>update(field,event.target.value)} maxLength={maxLength} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} {...(field === "capacity" ? {min:1,max:100000,step:1,placeholder:"Berapa orang yang bisa ikut?"} : {})}/>;
  if(step === 0) return <div className={styles.fields}>
    <label>Nama event <span className={styles.required}>Wajib</span>{input("title","text",100)}{error("title")}</label>
    <label>Jenis event<select name="category" value={draft.category} onChange={event=>update("category",event.target.value)}><option>Seminar & diskusi</option><option>Workshop</option><option>Kegiatan komunitas</option></select></label>
    {fieldsLocked ? <section aria-label="Bidang acara"><h3>Bidang acara</h3><p>{draft.matchingFields.join(", ") || "Belum tercatat"}</p><p className={styles.hint}>Bidang ditetapkan saat pembuatan acara dan tidak dapat diubah.</p></section> : <MultiSelect name="matchingFields" label="Bidang acara" value={draft.matchingFields} options={matchingFields.map(value=>({value,label:value}))} onChange={values=>update("matchingFields",matchingFields.filter(field=>values.includes(field)))} error={errors.matchingFields} hint="Pilih 1 sampai 5 bidang. Setelah acara selesai disusun, bidang tidak dapat diubah." />}
    <label>Ceritakan idenya <span className={styles.optional}>Opsional</span><textarea name="summary" value={draft.summary} onChange={event=>update("summary",event.target.value)} rows={4} maxLength={500} placeholder="Apa yang akan terjadi, dan kenapa orang perlu hadir?" aria-invalid={Boolean(errors.summary)} aria-describedby={`summary-help${errors.summary ? " summary-error" : ""}`}/><span id="summary-help" className={styles.hint}>Detail event saja. Jangan masukkan data pribadi peserta.</span>{error("summary")}</label>
  </div>;
  return <div className={styles.fields}>
    <label>Tanggal event {input("date","date")}{error("date")}</label>
    <div className={styles.fieldPair}><label>Jam mulai (WIB){input("startTime","time")}{error("startTime")}</label><label>Jam selesai (WIB){input("endTime","time")}{error("endTime")}</label></div>
    <label>Lokasi atau pelaksanaan online{input("venue","text",150)}{error("venue")}</label>
    <label>Kapasitas peserta{input("capacity","number")}{error("capacity")}</label>
  </div>;
}
