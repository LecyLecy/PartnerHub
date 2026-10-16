import EventEditorPage from "@/features/event/event-editor-page";
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; return <EventEditorPage id={id}/>; }
