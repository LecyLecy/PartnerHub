import { Loading as LoadingIndicator } from "@/lib/ui";
import uiStyles from "@/lib/ui.module.css";
export default function Loading() { return <div className={uiStyles.container}><div className={uiStyles.readingPage}><LoadingIndicator>Menyiapkan halaman…</LoadingIndicator></div></div>; }
