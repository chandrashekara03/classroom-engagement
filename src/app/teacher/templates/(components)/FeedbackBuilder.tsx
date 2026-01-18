"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createTemplate } from "../(actions)/createTemplate";
import { updateTemplate } from "../(actions)/updateTemplate";

interface FeedbackField {
  id?: string;
  field_name: string;
  field_type: string;
  required: boolean;
  order_index: number;
}

interface Template {
  id: string;
  name: string;
  type: string;
  settings?: {
    instructions?: string;
  };
  // Add other template properties as needed
}

interface FeedbackBuilderProps {
  isEdit: boolean;
  template?: Template;
}

export default function FeedbackBuilder({ isEdit, template }: FeedbackBuilderProps) {
  const [name, setName] = useState(template?.name || "");
  const [instructions, setInstructions] = useState(template?.settings?.instructions || "");
  const [fields, setFields] = useState<FeedbackField[]>([]);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadFields = useCallback(async () => {
    if (!template) return;
    const { data } = await supabase
      .from("feedback_fields")
      .select("*")
      .eq("template_id", template.id)
      .order("order_index");
    setFields(data || []);
  }, [template, supabase]);

  useEffect(() => {
    if (isEdit && template) {
      setName(template.name); // eslint-disable-line react-hooks/set-state-in-effect
      setInstructions(template.settings?.instructions || "");
      loadFields();
    }
  }, [isEdit, template, loadFields]);

  const addField = () => {
    setFields([...fields, {
      field_type: "text",
      field_name: "",
      required: false,
      order_index: fields.length
    }]);
  };

  const updateField = (index: number, field: keyof FeedbackField, value: string | boolean) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isEdit) {
      if (!template) return;
      await updateTemplate(template.id, { name, type: "feedback", instructions, fields });
    } else {
      await createTemplate({ name, type: "feedback", instructions, fields });
    }
    router.push("/teacher/templates");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Edit Feedback" : "Create Feedback"}</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Feedback Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="border p-2 w-full"
          rows={3}
        />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Fields</h2>
        {fields.map((field, index) => (
          <div key={index} className="border p-4 mb-4 rounded">
            <div className="mb-2">
              <input
                type="text"
                placeholder="Field label"
                value={field.field_name}
                onChange={(e) => updateField(index, "field_name", e.target.value)}
                className="border p-2 w-full"
              />
            </div>
            <div className="mb-2">
              <select
                value={field.field_type}
                onChange={(e) => updateField(index, "field_type", e.target.value)}
                className="border p-2 mr-2"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="rating">Rating</option>
              </select>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, "required", e.target.checked)}
                  className="mr-1"
                />
                Required
              </label>
            </div>
            <button onClick={() => removeField(index)} className="text-red-500">Remove Field</button>
          </div>
        ))}
        <button onClick={addField} className="bg-green-500 text-white px-4 py-2 rounded">+ Add Field</button>
      </div>
      <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">Save Feedback</button>
    </div>
  );
}