"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { validateLogo, type LogoAsset } from "./event-branding";
import styles from "./event-draft.module.css";

export function LogoImage({ asset, alt }: { asset: LogoAsset; alt: string }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const next = "file" in asset ? URL.createObjectURL(asset.file) : asset.remote.url;
    if (image.current) image.current.src = next;
    return () => { if ("file" in asset) URL.revokeObjectURL(next); };
  }, [asset]);
  // Local user-selected blobs cannot use the Next.js image optimization service.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={image} alt={alt} className={styles.logoImage} />;
}

export default function LogoInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LogoAsset | null;
  onChange: (value: LogoAsset | null) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  async function select(files: FileList | null) {
    if (!files?.length) return;
    if (files.length !== 1) {
      setError("Pilih satu gambar untuk setiap logo.");
      return;
    }
    const file = files[0];
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      await validateLogo(file);
      if (current === generation.current)
        change.current({ file, name: file.name });
    } catch (error) {
      if (current === generation.current)
        setError(
          error instanceof Error ? error.message : "Gambar tidak bisa dibaca.",
        );
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void select(event.dataTransfer.files);
  }

  return (
    <div className={styles.logoField}>
      <label htmlFor={id}>{label}</label>
      <div
        className={`${styles.uploadArea} ${dragging ? styles.dragging : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        aria-busy={busy}
      >
        <div className={styles.uploadThumb}>
          {value ? (
            <LogoImage asset={value} alt={label} />
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M12 16V3m-4 4 4-4 4 4M4 15v5h16v-5" />
            </svg>
          )}
        </div>
        <div className={styles.uploadContent}>
          <strong>
            {busy
              ? "Memeriksa gambar…"
              : value
                ? value.name
                : "Tarik gambar ke sini"}
          </strong>
          <span>
            {value
              ? "Logo tampil utuh, tidak dipotong."
              : "atau pilih file dari perangkatmu"}
          </span>
          <div className={styles.uploadActions}>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
            >
              {value ? "Ganti gambar" : "Pilih gambar"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  generation.current++;
                  setBusy(false);
                  setError("");
                  onChange(null);
                }}
              >
                Hapus gambar
              </button>
            )}
          </div>
        </div>
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={styles.fileInput}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            void select(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      <p id={`${id}-help`} className={styles.hint}>
        PNG, JPG, WebP · Maks. 2 MB · 4096 × 4096 px
      </p>
      {error && (
        <p id={`${id}-error`} className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
