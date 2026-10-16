import localFont from "next/font/local";
export const headingFont = localFont({ src: "../features/workspace/fonts/bricolage-700.ttf", weight: "700", variable: "--font-heading", display: "swap" });
export const bodyFont = localFont({ src: [{ path: "../features/workspace/fonts/manrope-400.ttf", weight: "400" }, { path: "../features/workspace/fonts/manrope-600.ttf", weight: "600" }], variable: "--font-body", display: "swap" });
