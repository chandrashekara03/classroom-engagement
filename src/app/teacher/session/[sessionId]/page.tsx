import dynamic from "next/dynamic";
const TeacherSessionView = dynamic(() => import("../(components)/TeacherSessionView"), { ssr: false });

export default function TeacherSessionPage({ params }: { params: { sessionId: string } }) {
  return <TeacherSessionView sessionId={params.sessionId} />;
}
