"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createTemplate } from "../(actions)/createTemplate";
import { updateTemplate } from "../(actions)/updateTemplate";

interface Question {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  order_index: number;
}

interface Template {
  id: string;
  name: string;
  type: string;
  // Add other template properties as needed
}

interface QuizBuilderProps {
  isEdit: boolean;
  template?: Template;
}

export default function QuizBuilder({ isEdit, template }: QuizBuilderProps) {
  const [name, setName] = useState(template?.name || "");
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("template_id", template.id)
      .order("order_index");
    setQuestions(data || []);
  };

  useEffect(() => {
    if (isEdit && template) {
      setName(template.name); // eslint-disable-line react-hooks/set-state-in-effect
      loadQuestions();
    }
  }, [isEdit, template]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: "",
      options: ["", ""],
      correct_answer: 0,
      order_index: questions.length
    }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number | string[]) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push("");
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isEdit) {
      await updateTemplate(template.id, { name, type: "quiz", questions });
    } else {
      await createTemplate({ name, type: "quiz", questions });
    }
    router.push("/teacher/templates");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Edit Quiz" : "Create Quiz"}</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Quiz Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="border p-4 mb-4 rounded">
            <div className="mb-2">
              <input
                type="text"
                placeholder="Question text"
                value={q.question_text}
                onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                className="border p-2 w-full"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Options</label>
              {q.options.map((opt, oIndex) => (
                <input
                  key={oIndex}
                  type="text"
                  placeholder={`Option ${oIndex + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                  className="border p-2 w-full mb-1"
                />
              ))}
              <button onClick={() => addOption(qIndex)} className="text-blue-500">+ Add Option</button>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Correct Answer</label>
              <select
                value={q.correct_answer}
                onChange={(e) => updateQuestion(qIndex, "correct_answer", parseInt(e.target.value))}
                className="border p-2"
              >
                {q.options.map((_, i) => (
                  <option key={i} value={i}>Option {i + 1}</option>
                ))}
              </select>
            </div>
            <button onClick={() => removeQuestion(qIndex)} className="text-red-500">Remove Question</button>
          </div>
        ))}
        <button onClick={addQuestion} className="bg-green-500 text-white px-4 py-2 rounded">+ Add Question</button>
      </div>
      <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">Save Quiz</button>
    </div>
  );
}