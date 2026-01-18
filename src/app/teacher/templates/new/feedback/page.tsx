import FeedbackBuilder from "../../(components)/FeedbackBuilder";

export default function NewFeedbackPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create Feedback Template</h1>
      <FeedbackBuilder isEdit={false} />
    </div>
  );
}