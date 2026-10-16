"use client";
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Notice, uiStyles } from "@/lib/ui";
import { Icon } from "@/lib/ui/icons";
import { getTicketQr } from "../services/registration-service";
import { QrImage } from "./qr-image";
import styles from "./qr.module.css";

const loadQr = (id: string) => getTicketQr(id);

/** Button and dialog that show one ticket's QR. The code is fetched only when opened and never kept in page state afterwards. */
export function TicketQr({ registrationId, title, reference, sent }: { registrationId: string; title: string; reference: string; sent: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  if (!sent) return <p className={styles.waiting}>QR belum dikirim penyelenggara.</p>;
  return <>
    <button type="button" className={uiStyles.secondary} aria-haspopup="dialog" aria-label={`Tampilkan QR ${title}`} onClick={() => setOpen(true)}><Icon name="qr" size={18} />Tampilkan QR</button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`qr-${registrationId}`} onClose={() => setOpen(false)} onClick={(click) => { if (click.target === dialog.current) setOpen(false); }}>
      {open && <Content registrationId={registrationId} title={title} reference={reference} close={() => setOpen(false)} />}
    </dialog>
  </>;
}

function Content({ registrationId, title, reference, close }: { registrationId: string; title: string; reference: string; close: () => void }) {
  const qr = useResource(registrationId, loadQr);
  return <>
    <button type="button" className={styles.close} aria-label="Tutup QR" onClick={close}><Icon name="close" /></button>
    <h2 id={`qr-${registrationId}`}>QR masuk</h2>
    <p>{title}</p>
    {qr.status === "loading" ? <div className={styles.state} role="status">Menyiapkan QR…</div>
      : qr.status === "error" ? <Notice error>{errorMessage(qr.error)} <button type="button" className={uiStyles.secondary} onClick={qr.reload}>Coba lagi</button></Notice>
      : qr.data ? <>
        <QrImage payload={qr.data.payload} label={`QR masuk untuk ${title}`} />
        <p className={styles.reference}>Referensi tiket {reference}</p>
        <p>Tunjukkan kode ini di pintu masuk. Jangan bagikan tangkapan layarnya ke orang lain.</p>
      </> : null}
  </>;
}
