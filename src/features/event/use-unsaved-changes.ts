"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/lib/ui/confirmation";
import type { LeaveDecision } from "@/lib/leave-guard";

type TraverseEvent = Event & { navigationType?: string; destination?: { key: string } };
type Navigation = EventTarget & { traverseTo: (key: string) => unknown };

export function useUnsavedChanges(dirty: boolean) {
  const confirm = useConfirm();
  const router = useRouter();
  useEffect(() => {
    if (!dirty) return;
    let approved = false;
    let active = true;
    const unload = (event: BeforeUnloadEvent) => {
      // Browsers do not allow custom dialogs during refresh or tab close.
      if (!approved) { event.preventDefault(); event.returnValue = ""; }
    };
    const ask = async () => {
      if (approved) return true;
      const accepted = await confirm({
        title: "Tinggalkan halaman?",
        description: "Perubahan acara yang belum disimpan akan hilang.",
        confirmLabel: "Tinggalkan halaman",
        destructive: true,
      });
      if (accepted && active) approved = true;
      return accepted && active;
    };
    const leave = (event: Event) => {
      (event as CustomEvent<LeaveDecision>).detail.decision = ask();
    };
    const cancelled = () => { approved = false; };
    const navigation = (window as Window & { navigation?: Navigation }).navigation;
    const traverse = (event: TraverseEvent) => {
      if (approved || event.navigationType !== "traverse" || !event.cancelable || !event.destination?.key) return;
      event.preventDefault();
      const key = event.destination.key;
      void ask().then(accepted => { if (accepted) navigation?.traverseTo(key); });
    };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (approved || !(link instanceof HTMLAnchorElement) || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (!["http:", "https:"].includes(url.protocol) || (url.pathname === location.pathname && url.search === location.search && url.origin === location.origin)) return;
      event.preventDefault();
      event.stopPropagation();
      void ask().then(accepted => {
        if (!accepted) return;
        if (url.origin === location.origin) router.push(url.pathname + url.search + url.hash);
        else window.location.assign(url.href);
      });
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("partnerhub:before-leave", leave);
    window.addEventListener("partnerhub:leave-cancelled", cancelled);
    navigation?.addEventListener("navigate", traverse);
    document.addEventListener("click", click, true);
    return () => {
      active = false;
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("partnerhub:before-leave", leave);
      window.removeEventListener("partnerhub:leave-cancelled", cancelled);
      navigation?.removeEventListener("navigate", traverse);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, confirm, router]);
}
