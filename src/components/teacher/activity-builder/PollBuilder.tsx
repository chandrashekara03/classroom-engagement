"use client";

import { Plus, Trash } from "lucide-react";

interface PollOption {
  id: string;
  text: string;
}

interface PollData {
  options: PollOption[];
}

export function PollBuilder({ data, onChange }: { data: PollData, onChange: (d: PollData) => void }) {
  const updateOption = (index: number, text: string) => {
    const newOptions = [...data.options];
    newOptions[index] = { ...newOptions[index], text };
    onChange({ ...data, options: newOptions });
  };

  const removeOption = (index: number) => {
    onChange({
      ...data,
      options: data.options.filter((_, i: number) => i !== index)
    });
  };

  const addOption = () => {
    onChange({
      ...data,
      options: [
        ...data.options,
        { id: `opt-${Date.now()}`, text: `Option ${data.options.length + 1}` }
      ]
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Poll Question</label>
        <textarea
          value={data.question || ""}
          onChange={(e) => onChange({ ...data, question: e.target.value })}
          placeholder="What would you like to ask?"
          className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none h-24"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">Options</label>
        {data.options.map((opt: PollOption, i: number) => (
          <div key={opt.id} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
              {String.fromCharCode(65 + i)}
            </div>
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              placeholder={`Option ${i + 1}`}
            />
            {data.options.length > 2 && (
              <button onClick={() => removeOption(i)} className="text-slate-400 hover:text-red-500 p-2">
                <Trash size={16} />
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={addOption}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
        >
          <Plus size={16} /> Add another option
        </button>
      </div>
    </div>
  );
}
