"use client";

import { useState } from "react";
import { Copy, Plus, Trash } from "lucide-react";

export function QuizBuilder({ data, onChange }: { data: any, onChange: (d: any) => void }) {
  const handleAddQuestion = () => {
    const qLabel = `Question ${data.questions.length + 1}`;
    onChange({
      ...data,
      questions: [
        ...data.questions,
        {
          id: `q-${Date.now()}`,
          text: qLabel,
          type: "MULTIPLE_CHOICE",
          points: 10,
          options: [
            { id: `opt-${Date.now()}-1`, text: "Option A", isCorrect: true },
            { id: `opt-${Date.now()}-2`, text: "Option B", isCorrect: false },
          ],
          correctAnswers: []
        }
      ]
    });
  };

  const updateQuestion = (index: number, updates: any) => {
    const newQuestions = [...data.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange({ ...data, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    onChange({
      ...data,
      questions: data.questions.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Quiz Questions</h3>
        <button
          onClick={handleAddQuestion}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          <Plus size={16} /> Add Question
        </button>
      </div>

      {data.questions.map((q: any, i: number) => (
        <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-start justify-between">
            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestion(i, { text: e.target.value })}
              className="font-medium text-slate-900 w-full outline-none border-b border-transparent focus:border-blue-500 bg-transparent px-1 py-1 transition-colors"
              placeholder="Enter question text..."
            />
            <button onClick={() => removeQuestion(i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors ml-4">
              <Trash size={16} />
            </button>
          </div>

          <div className="space-y-3 pl-4 border-l-2 border-slate-100">
            {q.options.map((opt: any, optIndex: number) => (
              <div key={opt.id} className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`correct-${q.id}`}
                  checked={opt.isCorrect}
                  onChange={() => {
                    const newOpts = q.options.map((o: any, idx: number) => ({ ...o, isCorrect: idx === optIndex }));
                    updateQuestion(i, { options: newOpts });
                  }}
                  className="w-4 h-4 text-blue-600"
                />
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = [...q.options];
                    newOpts[optIndex].text = e.target.value;
                    updateQuestion(i, { options: newOpts });
                  }}
                  className="w-full text-sm outline-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const newOpts = q.options.filter((_: any, idx: number) => idx !== optIndex);
                    updateQuestion(i, { options: newOpts });
                  }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateQuestion(i, {
                  options: [...q.options, { id: `opt-${Date.now()}`, text: `Option ${q.options.length + 1}`, isCorrect: false }]
                });
              }}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium mt-2"
            >
              <Plus size={14} /> Add Option
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
