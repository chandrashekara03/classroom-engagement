"use client";

import Link from "next/link";
import { deleteTemplate } from "../(actions)/deleteTemplate";

interface Template {
  id: string;
  title: string;
  type: string;
  updated_at: string;
}

interface TemplateListProps {
  templates: Template[];
}

export default function TemplateList({ templates }: TemplateListProps) {
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      {templates.map((template, index) => (
        <div
          key={template.id}
          className="glass p-6 rounded-xl animate-fade-in hover:scale-[1.02] transition-all duration-200"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
                {template.title}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="text-lg">
                    {template.type === 'quiz' ? '📝' :
                     template.type === 'poll' ? '📊' : '💬'}
                  </span>
                  {template.type}
                </span>
                <span className="flex items-center gap-1">
                  📅 Updated {new Date(template.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-3 ml-4">
              <Link
                href={`/teacher/templates/${template.id}/edit`}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                ✏️ Edit
              </Link>
              <button
                onClick={() => handleDelete(template.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      {templates.length === 0 && (
        <div className="glass p-8 text-center animate-fade-in">
          <div className="text-neutral-400 text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">No Templates Yet</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">Create your first activity template to get started.</p>
          <Link
            href="/teacher/templates/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg inline-block"
          >
            Create Your First Template
          </Link>
        </div>
      )}
    </div>
  );
}