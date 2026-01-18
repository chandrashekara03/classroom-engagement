import dynamic from "next/dynamic";
const StudentSessionView = dynamic(() => import("../(components)/StudentSessionView"), { ssr: false });

export default function StudentSessionPage({ params }: { params: { sessionId: string } }) {
  return <StudentSessionView sessionId={params.sessionId} />;
}
