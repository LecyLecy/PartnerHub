import type { CSSProperties } from "react";

export type IconName =
  | "overview"
  | "event"
  | "registration"
  | "committee"
  | "attendance"
  | "sponsorship"
  | "arrow"
  | "search"
  | "close"
  | "menu"
  | "guide"
  | "clock"
  | "location"
  | "check"
  | "info";

const paths: Record<IconName, string> = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  event: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2",
  registration: "M7 3h10v4H7z M7 5H4v16h16V5h-3 M8 12h8 M8 16h5",
  committee:
    "M16 21v-3a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v3 M20 21v-3a4 4 0 0 0-3-3.87 M10 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 3.5a4 4 0 0 1 0 7",
  attendance: "M3 8V3h5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5 M8 12l3 3 5-6",
  sponsorship: "M3 5h18v14H3z M3 9h18 M8 14h3 M16 13v3",
  arrow: "M5 12h14 M14 7l5 5-5 5",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15 M16 16l5 5",
  close: "M6 6l12 12 M18 6 6 18",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  guide:
    "M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1z M12 5v15",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2",
  location:
    "M12 21s7-7 7-12A7 7 0 0 0 5 9c0 5 7 12 7 12z M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  check: "M5 12l4 4L19 6",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 11v6 M12 7v.1",
};

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
