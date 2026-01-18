"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QuizBuilder from "../../(components)/QuizBuilder";
import PollBuilder from "../../(components)/PollBuilder";
import FeedbackBuilder from "../../(components)/FeedbackBuilder";

interface Template {
  id: string;
  name: string;
  type: string;
  settings?: {
    instructions?: string;
  };
  // Add other template properties as needed
}

export default function EditTemplatePage() {
  const { templateId } = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const loadTemplate = async () => {
      const { data } = await supabase
        .from("activity_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      setTemplate(data);
      setLoading(false);
    };

    loadTemplate();
  }, [templateId]);

  if (loading) return <div>Loading...</div>;
  if (!template) return <div>Template not found</div>;

  if (template.type === "quiz") {
    return <QuizBuilder isEdit={true} template={template} />;
  }
  if (template.type === "poll") {
    return <PollBuilder isEdit={true} template={template} />;
  }
  if (template.type === "feedback") {
    return <FeedbackBuilder isEdit={true} template={template} />;
  }
  return <div>Invalid type</div>;
}