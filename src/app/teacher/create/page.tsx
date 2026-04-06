"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@classroom/ui-components";
import { ActivityType } from "@classroom/shared-utils";
import { LucideChevronLeft, LucideSave, LucideTimer, LucideTrophy, LucideSettings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuizBuilder } from "@/components/teacher/activity-builder/QuizBuilder";
import { PollBuilder } from "@/components/teacher/activity-builder/PollBuilder";
import { FeedbackBuilder } from "@/components/teacher/activity-builder/FeedbackBuilder";
import { GroupingBuilder } from "@/components/teacher/activity-builder/GroupingBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { dbService } from "@/lib/database";

export default function CreateActivity() {
  const router = useRouter();
  const { user } = useAuth();
  const [type, setType] = useState<ActivityType | null>(null);
  const [title, setTitle] = useState("");
  
  // Generic activity configuration payload
  const [activityData, setActivityData] = useState<any>({
    questions: [],
    options: [{ id: 'opt-1', text: 'Option 1' }, { id: 'opt-2', text: 'Option 2' }]
  });

  const [settings, setSettings] = useState({
    timer: true,
    scoring: true,
  });

  const activityTypes: { type: ActivityType; label: string; description: string }[] = [
    { type: "QUIZ", label: "Quiz", description: "Standard multiple-choice or short answer assessment." },
    { type: "POLL", label: "Live Poll", description: "Collect instant feedback or opinions from students." },
    { type: "FEEDBACK", label: "Feedback Board", description: "Open-ended digital sticky notes for thoughts." },
    { type: "PAIRING", label: "Grouping", description: "Automatically pair or group students instantly." },
  ];

  const handleSave = async () => {
    if (!title) {
      alert("Please enter a title");
      return;
    }

    if (!user) {
      alert("You need to be logged in as faculty to save templates.");
      return;
    }
    
    const newActivity = {
      id: `act-${Date.now()}`,
      teacherId: user.uid,
      type,
      title,
      config: settings,
      ...activityData,
      createdAt: new Date().toISOString()
    };

    await dbService.createActivityTemplate({
      id: newActivity.id,
      teacherId: newActivity.teacherId,
      type: String(newActivity.type || ''),
      title: newActivity.title,
      config: newActivity.config,
      questions: Array.isArray((newActivity as any).questions) ? (newActivity as any).questions : undefined,
      options: Array.isArray((newActivity as any).options) ? (newActivity as any).options : undefined,
      prompt: (newActivity as any).prompt,
      groupSize: (newActivity as any).groupSize,
    });
    
    router.push('/teacher');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <LucideChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">New Activity Template</h1>
      </div>

      {!type ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activityTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setType(item.type);
                if (item.type === "QUIZ") {
                  setActivityData({
                    questions: [{
                      id: `q-${Date.now()}`,
                      text: "Question 1",
                      type: "MULTIPLE_CHOICE",
                      points: 10,
                      options: [
                        { id: `opt-1`, text: "Option A", isCorrect: true },
                        { id: `opt-2`, text: "Option B", isCorrect: false }
                      ],
                      correctAnswers: []
                    }]
                  });
                } else if (item.type === "POLL") {
                  setActivityData({
                    question: "",
                    options: [{ id: 'opt-1', text: '' }, { id: 'opt-2', text: '' }]
                  });
                } else if (item.type === "FEEDBACK") {
                  setActivityData({
                    prompt: ""
                  });
                } else if (item.type === "PAIRING") {
                  setActivityData({
                    prompt: "",
                    groupSize: 4
                  });
                }
              }}
              className="text-left p-6 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <h3 className="text-lg font-semibold group-hover:text-blue-700">{item.label}</h3>
              <p className="text-slate-500 text-sm mt-1">{item.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50">
              <CardTitle>Activity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Activity Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Review Quiz"
                  className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                {type === "QUIZ" && <QuizBuilder data={activityData} onChange={setActivityData} />}
                {type === "POLL" && <PollBuilder data={activityData} onChange={setActivityData} />}
                {type === "FEEDBACK" && <FeedbackBuilder data={activityData} onChange={setActivityData} />}
                {type === "PAIRING" && <GroupingBuilder data={activityData} onChange={setActivityData} />}
                
                {type !== "QUIZ" && type !== "POLL" && type !== "FEEDBACK" && type !== "PAIRING" && (
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 text-sm flex items-center gap-2">
                    <LucideSettings size={16} />
                    Builder for {type} is under construction. You can still save it as a draft.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <LucideSettings size={18} className="text-slate-500" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <ToggleItem 
                  icon={<LucideTimer size={16} />} 
                  label="Timer" 
                  value={settings.timer}
                  onChange={() => setSettings(s => ({ ...s, timer: !s.timer }))}
                />
                <ToggleItem 
                  icon={<LucideTrophy size={16} />} 
                  label="Scoring" 
                  value={settings.scoring}
                  onChange={() => setSettings(s => ({ ...s, scoring: !s.scoring }))}
                />
              </CardContent>
            </Card>

            <button 
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 py-3 rounded-lg transition-colors shadow-sm"
            >
              <LucideSave size={20} />
              Save Template
            </button>
            <button onClick={() => setType(null)} className="w-full text-slate-500 hover:text-slate-700 text-sm hover:underline font-medium">
              Change Activity Type
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleItem({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
        {icon}
        {label}
      </div>
      <button 
        type="button"
        onClick={onChange}
        className={`w-11 h-6 rounded-full relative transition-colors ${value ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'left-6' : 'left-1'}`}></div>
      </button>
    </div>
  );
}
