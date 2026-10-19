import { MyApplications } from "@/features/committee/my-applications";
import { PageHeader, ProtectedPage } from "@/lib/ui";
export default function Page() { return <ProtectedPage><PageHeader title="Lamaran saya">Pantau hasil dan tahapan seleksi panitia.</PageHeader><MyApplications /></ProtectedPage>; }
