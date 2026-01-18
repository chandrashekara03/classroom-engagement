"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "boolean", label: "True/False" },
  { value: "short", label: "Short Answer" },
];

interface Question {
  id: string;
  type: string;
  text: string;
  options: string[];
  correct: string[];
  points: number;
}

export default function QuizTemplateBuilder() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: nanoid(),
        type: "mcq",
        text: "",
        options: ["", ""],
        correct: [],
        points: 1,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, data: Partial<Question>) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, ...data } : q)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert template
      const { data: template, error: templateError } = await supabase
        .from("templates")
        .insert([
          {
            teacher_id: user.id,
            type: "quiz",
            title,
            data: { questions },
          },
        ])
        .select()
        .single();
      if (templateError) throw templateError;

      // Insert quiz_questions
      for (const [index, q] of questions.entries()) {
        await supabase.from("quiz_questions").insert({
          template_id: template.id,
          question: q.text,
          options: q.type === "mcq" ? q.options : null,
          correct_answer: q.type === "mcq" ? q.correct.join(",") : q.correct,
          "order": index,
        });
      }
      router.push("/teacher/templates");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quiz Title */}
      <div className="glass p-6 animate-fade-in">
        <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
          Quiz Title
        </label>
        <input
          className="w-full glass border-0 p-4 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          placeholder="Enter quiz title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="glass p-6 animate-fade-in rounded-xl" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Question {idx + 1}
              </h3>
              <button
                type="button"
                className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                onClick={() => removeQuestion(q.id)}
              >
                🗑️ Remove
              </button>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Question Text
              </label>
              <textarea
                className="w-full glass border-0 p-4 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter your question..."
                value={q.text}
                onChange={e => updateQuestion(q.id, { text: e.target.value })}
                rows={3}
              />
            </div>

            {/* Question Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Question Type
              </label>
              <select
                className="w-full glass border-0 p-4 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={q.type}
                onChange={e => updateQuestion(q.id, { type: e.target.value })}
              >
                {QUESTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* MCQ Options */}
            {q.type === "mcq" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">
                  Answer Options
                </label>
                <div className="space-y-2">
                  {q.options.map((opt: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 glass border-0 p-3 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={opt}
                        placeholder={`Option ${i + 1}`}
                        onChange={e => {
                          const opts = [...q.options];
                          opts[i] = e.target.value;
                          updateQuestion(q.id, { options: opts });
                        }}
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 transition-colors p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                        onClick={() => {
                          const opts = q.options.filter((_: string, idx: number) => idx !== i);
                          updateQuestion(q.id, { options: opts });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-3 text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  onClick={() => updateQuestion(q.id, { options: [...q.options, ""] })}
                >
                  ➕ Add Option
                </button>

                {/* Correct Answers */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                    Correct Answer(s)
                  </label>
                  <select
                    multiple
                    className="w-full glass border-0 p-4 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                    value={q.correct}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, o => o.value);
                      updateQuestion(q.id, { correct: selected });
                    }}
                  >
                    {q.options.filter(opt => opt.trim()).map((opt: string, i: number) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Hold Ctrl/Cmd to select multiple correct answers
                  </p>
                </div>
              </div>
            )}

            {/* Boolean Options */}
            {q.type === "boolean" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                  Correct Answer
                </label>
                <select
                  className="w-full glass border-0 p-4 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={q.correct[0] || ""}
                  onChange={e => updateQuestion(q.id, { correct: [e.target.value] })}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            )}

            {/* Short Answer */}
            {q.type === "short" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                  Correct Answer (Optional)
                </label>
                <input
                  className="w-full glass border-0 p-4 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={q.correct[0] || ""}
                  placeholder="Enter the expected answer..."
                  onChange={e => updateQuestion(q.id, { correct: [e.target.value] })}
                />
              </div>
            )}

            {/* Points */}
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                Points
              </label>
              <input
                type="number"
                className="w-24 glass border-0 p-3 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-semibold"
                value={q.points}
                min={1}
                onChange={e => updateQuestion(q.id, { points: Number(e.target.value) })}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      <div className="glass p-6 animate-fade-in">
        <button
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
          onClick={addQuestion}
        >
          ➕ Add Question
        </button>
      </div>

      {/* Save Actions */}
      <div className="glass p-6 animate-fade-in">
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-neutral-400 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handleSave}
            disabled={saving || !title.trim() || questions.length === 0}
          >
            {saving ? "💾 Saving..." : "💾 Save Quiz Template"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 glass border-l-4 border-red-500 text-red-700 dark:text-red-300">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}
