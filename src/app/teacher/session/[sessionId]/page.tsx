import TeacherSessionView from "../(components)/TeacherSessionView";

export default function TeacherSessionPage({ params }: { params: { sessionId: string } }) {
  return <TeacherSessionView sessionId={params.sessionId} />;
}
