"use client";

interface FeedbackData {
  prompt?: string;
  enableRating?: boolean;
}

export function FeedbackBuilder({ data, onChange }: { data: FeedbackData, onChange: (d: FeedbackData) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Feedback Prompt</label>
        <textarea
          value={data.prompt || ""}
          onChange={(e) => onChange({ ...data, prompt: e.target.value })}
          placeholder="e.g. What was the most confusing part of today's lecture?"
          className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none h-24"
        />
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <p className="text-sm font-medium text-slate-800">Student View Options:</p>
        <p className="text-sm text-slate-600">Students will see this prompt and be able to submit text responses to the live board anonymously.</p>
      </div>
    </div>
  );
}
