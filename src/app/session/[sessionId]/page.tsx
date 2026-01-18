import StudentSessionView from "../(components)/StudentSessionView";

export default function StudentSessionPage({ params }: { params: { sessionId: string } }) {
  return <StudentSessionView sessionId={params.sessionId} />;
}
