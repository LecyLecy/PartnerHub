"use client";
import { useEffect } from "react";
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const leave = (event: Event) => { if (!window.confirm("Ada perubahan event yang belum disimpan. Tinggalkan halaman?")) event.preventDefault(); };
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const traverse = (event: Event) => { if ((event as Event & { navigationType?: string }).navigationType === "traverse" && event.cancelable) leave(event); };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (!window.confirm("Ada perubahan event yang belum disimpan. Tinggalkan halaman?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("partnerhub:before-leave", leave);
    navigation?.addEventListener("navigate", traverse);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("partnerhub:before-leave", leave); navigation?.removeEventListener("navigate", traverse); document.removeEventListener("click", click, true); };
  }, [dirty]);
}
