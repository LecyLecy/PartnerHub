"use client";
import { useMemo, useState, type ReactNode } from "react";
import styles from "./components.module.css";

export type Column<T> = { key: string; header: string; render: (row: T) => ReactNode; sortValue?: (row: T) => string | number };

/** Sortable table on data the caller already loaded. Sorting is local and never changes the source order. */
export function DataTable<T>({ columns, rows, rowKey, caption, onRowClick }: { columns: readonly Column<T>[]; rows: readonly T[]; rowKey: (row: T) => string; caption: string; onRowClick?: (row: T) => void }) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sort?.key);
    if (!sort || !column?.sortValue) return rows;
    const value = column.sortValue;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = value(a), right = value(b);
      return (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "id")) * factor;
    });
  }, [columns, rows, sort]);
  const toggle = (key: string) => setSort((current) => current?.key === key ? (current.direction === "asc" ? { key, direction: "desc" } : null) : { key, direction: "asc" });
  // Focusable so keyboard users can scroll a table that is wider than its container.
  return <div className={styles.tableWrap} role="region" aria-label={caption} tabIndex={0}>
    <table className={styles.table}>
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{columns.map((column) => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : column.sortValue ? "none" : undefined}>
        {column.sortValue
          ? <button type="button" className={styles.sortButton} data-direction={sort?.key === column.key ? sort.direction : undefined} onClick={() => toggle(column.key)}>{column.header}<svg className={styles.sortArrow} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /></svg></button>
          : column.header}
      </th>)}</tr></thead>
      <tbody>{sorted.map((row) => <tr key={rowKey(row)} data-clickable={onRowClick ? "true" : undefined} onClick={onRowClick ? (event) => { if (!(event.target as HTMLElement).closest("a, button, input, select, textarea, summary")) onRowClick(row); } : undefined}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
