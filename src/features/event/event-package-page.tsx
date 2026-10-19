"use client";
import { useResource } from "@/lib/use-resource";
import { errorMessage } from "@/lib/api-client";
import { Breadcrumb, Loading, Notice, PageHeader, ProtectedPage, uiStyles } from "@/lib/ui";
import { EventPackagePanel, getEventPackage } from "./event-package-panel";

export default function EventPackagePage({ id }: { id: string }) { return <ProtectedPage><Package id={id} /></ProtectedPage>; }
function Package({ id }: { id: string }) {
  const resource = useResource(id, getEventPackage);
  return <><Breadcrumb href={`/events/${id}`} parent="Ringkasan acara" current="Pengelola acara" /><PageHeader title="Pengelola acara">Atur akses pengelola untuk acara ini saja.</PageHeader>
    {resource.status === "loading" ? <Loading>Memuat paket acara…</Loading> : resource.status === "error" ? <Notice error>{errorMessage(resource.error)} <button className={uiStyles.secondary} onClick={resource.reload}>Coba lagi</button></Notice> : resource.data && <EventPackagePanel key={`${id}:${resource.data.managerIds.join(":")}`} id={id} value={resource.data} reload={resource.reload} />}
  </>;
}
