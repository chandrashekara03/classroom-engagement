"use client";

import { Users } from "lucide-react";

interface GroupingData {
  prompt?: string;
  groupSize?: number;
}

export function GroupingBuilder({ data, onChange }: { data: GroupingData, onChange: (d: GroupingData) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Grouping Prompt (Optional)</label>
        <input
          type="text"
          value={data.prompt || ""}
          onChange={(e) => onChange({ ...data, prompt: e.target.value })}
          placeholder="e.g. Discuss the reading assignment in your groups"
          className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-900"
        />
      </div>

      <div className="flex items-center gap-6 p-6 border border-slate-200 rounded-xl bg-slate-50">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={24} />
        </div>
        <div className="flex-1 space-y-1">
            <label className="text-sm font-bold text-slate-900">Target Group Size</label>
            <p className="text-xs font-medium text-slate-500">How many students per group?</p>
        </div>
        <div className="w-32">
            <select 
                value={data.groupSize || 4} 
                onChange={(e) => onChange({ ...data, groupSize: parseInt(e.target.value) })}
                className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900"
            >
                {[2, 3, 4, 5, 6, 8, 10].map(size => (
                    <option key={size} value={size}>{size} Students</option>
                ))}
            </select>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl space-y-2">
        <p className="text-sm font-bold">Live Group Generation</p>
        <p className="text-sm">Groups will be generated mathematically in real-time when the activity starts, based on the number of students currently present in the waiting room.</p>
      </div>
    </div>
  );
}
