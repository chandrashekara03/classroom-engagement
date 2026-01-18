import QuizTemplateBuilder from "../../quiz/(components)/QuizTemplateBuilder";

export default function NewQuizPage() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass p-8 mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            📝 Create Quiz Template
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">Build an interactive quiz with multiple choice questions</p>
        </div>
        <QuizTemplateBuilder />
      </div>
    </div>
  );
}