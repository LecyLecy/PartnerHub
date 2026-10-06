import EventDetailPage from "@/features/event/event-detail-page";
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; return <EventDetailPage id={id}/>; }
