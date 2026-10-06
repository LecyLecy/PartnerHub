import { useMemo } from "react";
import { encodeQr } from "./qr-code";
import styles from "./qr.module.css";

const QUIET = 4;

/**
 * Draws the code as one SVG path, dark modules on white with the 4 module quiet zone a scanner needs.
 * The payload stays opaque: it is only ever drawn, never shown as text.
 */
export function QrImage({ payload, label }: { payload: string; label: string }) {
  const { size, path } = useMemo(() => {
    const { size, modules } = encodeQr(payload);
    let d = "";
    modules.forEach((row, y) => row.forEach((dark, x) => { if (dark) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`; }));
    return { size, path: d };
  }, [payload]);
  const full = size + QUIET * 2;
  return <svg className={styles.qr} viewBox={`0 0 ${full} ${full}`} role="img" aria-label={label} shapeRendering="crispEdges">
    <rect width={full} height={full} fill="#fff" />
    <path d={path} fill="#000" />
  </svg>;
}
