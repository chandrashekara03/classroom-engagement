"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createTemplate } from "../(actions)/createTemplate";
import { updateTemplate } from "../(actions)/updateTemplate";

interface PollOption {
  id?: string;
  option_text: string;
  order_index: number;
}

interface PollBuilderProps {
  isEdit: boolean;
  template?: any;
}

export default function PollBuilder({ isEdit, template }: PollBuilderProps) {
  const [name, setName] = useState(template?.name || "");
  const [options, setOptions] = useState<PollOption[]>([]);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isEdit && template) {
      setName(template.name);
      loadOptions();
    }
  }, [isEdit, template]);

  const loadOptions = async () => {
    const { data } = await supabase
      .from("poll_options")
      .select("*")
      .eq("template_id", template.id)
      .order("order_index");
    setOptions(data || []);
  };

  const addOption = () => {
    setOptions([...options, { option_text: "", order_index: options.length }]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].option_text = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (isEdit) {
      await updateTemplate(template.id, { name, type: "poll", options });
    } else {
      await createTemplate({ name, type: "poll", options });
    }
    router.push("/teacher/templates");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Edit Poll" : "Create Poll"}</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Poll Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Options</h2>
        {options.map((opt, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              placeholder="Option text"
              value={opt.option_text}
              onChange={(e) => updateOption(index, e.target.value)}
              className="border p-2 flex-1 mr-2"
            />
            <button onClick={() => removeOption(index)} className="text-red-500">Remove</button>
          </div>
        ))}
        <button onClick={addOption} className="bg-green-500 text-white px-4 py-2 rounded">+ Add Option</button>
      </div>
      <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">Save Poll</button>
    </div>
  );
}