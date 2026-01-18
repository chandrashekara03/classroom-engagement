import PollBuilder from "../../(components)/PollBuilder";

export default function NewPollPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create Poll Template</h1>
      <PollBuilder isEdit={false} />
    </div>
  );
}