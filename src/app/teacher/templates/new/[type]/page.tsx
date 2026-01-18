"use client";

import { useParams } from "next/navigation";
import QuizBuilder from "../../(components)/QuizBuilder";
import PollBuilder from "../../(components)/PollBuilder";
import FeedbackBuilder from "../../(components)/FeedbackBuilder";

export default function NewTemplateEditor() {
  const { type } = useParams();

  if (type === "quiz") {
    return <QuizBuilder isEdit={false} />;
  }
  if (type === "poll") {
    return <PollBuilder isEdit={false} />;
  }
  if (type === "feedback") {
    return <FeedbackBuilder isEdit={false} />;
  }
  return <div>Invalid type</div>;
}