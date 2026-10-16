"use client";
import { useEffect, useRef, useState } from "react";
import { readQr } from "./qr-reader";
import { Notice, uiStyles } from "@/lib/ui";
import styles from "./scan.module.css";

export function CameraScanner({ onRead, onStop }: { onRead: (payload: string) => void; onStop: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failure, setFailure] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopTracks = () => stream?.getTracks().forEach((track) => track.stop());
    const canvas = document.createElement("canvas");
    const read = () => {
      if (disposed || !video.current) return;
      const element = video.current;
      if (element.readyState >= 2 && element.videoWidth) {
        const scale = Math.min(1, 960 / element.videoWidth);
        canvas.width = Math.round(element.videoWidth * scale);
        canvas.height = Math.round(element.videoHeight * scale);
        canvas.getContext("2d")?.drawImage(element, 0, 0, canvas.width, canvas.height);
        const payload = readQr(canvas);
        if (payload) { stopTracks(); onRead(payload); return; }
      }
      timer = setTimeout(read, 250);
    };
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Kamera membutuhkan HTTPS atau localhost. Kamu juga bisa memilih gambar QR.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (disposed) { stopTracks(); return; }
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
        if (disposed) return;
        setReady(true); read();
      } catch (error) {
        stopTracks();
        if (!disposed) setFailure(!navigator.mediaDevices?.getUserMedia ? "Kamera membutuhkan HTTPS atau localhost. Kamu juga bisa memilih gambar QR." : error instanceof DOMException && error.name === "NotAllowedError" ? "Izin kamera ditolak. Izinkan kamera di browser atau pilih gambar QR." : "Kamera tidak dapat dibuka. Periksa perangkat dan izin kamera, atau pilih gambar QR.");
      }
    }
    void start();
    const hide = () => { if (document.hidden) { stopTracks(); onStop(); } };
    document.addEventListener("visibilitychange", hide);
    return () => { disposed = true; clearTimeout(timer); stopTracks(); document.removeEventListener("visibilitychange", hide); };
  }, [onRead, onStop]);
  return <div className={styles.camera}>
    {failure ? <Notice error>{failure}</Notice> : <><video ref={video} autoPlay playsInline muted aria-label="Pratinjau kamera untuk scan tiket" /><p role="status">{ready ? "Arahkan kamera ke QR tiket peserta." : "Menunggu kamera…"}</p></>}
    <button type="button" className={uiStyles.secondary} onClick={onStop}>Tutup kamera</button>
  </div>;
}
