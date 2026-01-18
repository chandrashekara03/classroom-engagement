"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { nanoid } from "nanoid";

const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "boolean", label: "True/False" },
  { value: "short", label: "Short Answer" },
];

export default function QuizTemplateBuilder() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClientComponentClient();

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

  const updateQuestion = (id: string, data: any) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, ...data } : q)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Insert activity_template
      const { data: template, error: templateError } = await supabase
        .from("activity_templates")
        .insert([
          {
            type: "quiz",
            title,
            settings: { questions },
          },
        ])
        .select()
        .single();
      if (templateError) throw templateError;
      // Insert quiz_questions
      for (const [order_index, q] of questions.entries()) {
        await supabase.from("quiz_questions").insert({
          activity_template_id: template.id,
          question_text: q.text,
          options: q.type === "mcq" ? q.options : null,
          correct_answer: q.type === "mcq" ? q.correct.join(",") : q.correct,
          order_index,
        });
      }
      router.push("/teacher/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">New Quiz Template</h1>
      <input
        className="border p-2 w-full mb-4"
        placeholder="Quiz Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Question {idx + 1}</span>
              <button type="button" className="text-red-500" onClick={() => removeQuestion(q.id)}>
                Remove
              </button>
            </div>
            <input
              className="border p-2 w-full mb-2"
              placeholder="Question text"
              value={q.text}
              onChange={e => updateQuestion(q.id, { text: e.target.value })}
            />
            <select
              className="border p-2 w-full mb-2"
              value={q.type}
              onChange={e => updateQuestion(q.id, { type: e.target.value })}
            >
              {QUESTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {q.type === "mcq" && (
              <div className="mb-2">
                <div className="font-medium mb-1">Options</div>
                {q.options.map((opt: string, i: number) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <input
                      className="border p-1 flex-1"
                      value={opt}
                      onChange={e => {
                        const opts = [...q.options];
                        opts[i] = e.target.value;
                        updateQuestion(q.id, { options: opts });
                      }}
                    />
                    <button type="button" onClick={() => {
                      const opts = q.options.filter((_: any, idx: number) => idx !== i);
                      updateQuestion(q.id, { options: opts });
                    }}>Remove</button>
                  </div>
                ))}
                <button type="button" className="text-blue-500" onClick={() => updateQuestion(q.id, { options: [...q.options, ""] })}>
                  Add Option
                </button>
                <div className="mt-2">
                  <label className="font-medium">Correct Option(s):</label>
                  <select
                    multiple
                    className="border p-1 w-full"
                    value={q.correct}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, o => o.value);
                      updateQuestion(q.id, { correct: selected });
                    }}
                  >
                    {q.options.map((opt: string, i: number) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {q.type === "boolean" && (
              <div className="mb-2">
                <label className="font-medium">Correct Answer:</label>
                <select
                  className="border p-1 w-full"
                  value={q.correct}
                  onChange={e => updateQuestion(q.id, { correct: e.target.value })}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            )}
            {q.type === "short" && (
              <div className="mb-2">
                <label className="font-medium">Correct Answer (optional):</label>
                <input
                  className="border p-1 w-full"
                  value={q.correct}
                  onChange={e => updateQuestion(q.id, { correct: e.target.value })}
                />
              </div>
            )}
            <div className="mb-2">
              <label className="font-medium">Points:</label>
              <input
                type="number"
                className="border p-1 w-20"
                value={q.points}
                min={1}
                onChange={e => updateQuestion(q.id, { points: Number(e.target.value) })}
              />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={addQuestion}>
        Add Question
      </button>
      <button
        type="button"
        className="mt-4 ml-4 bg-green-600 text-white px-4 py-2 rounded"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Quiz Template"}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
