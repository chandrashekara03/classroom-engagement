import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  sessionId: string;
  isTeacher: boolean;
}

export default function Quiz({ sessionId, isTeacher }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const quizRef = ref(database, `sessions/${sessionId}/quiz`);
    onValue(quizRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setQuestions(data.questions || []);
        setCurrentQuestion(data.currentQuestion || 0);
        setAnswers(data.answers || {});
      }
    });
  }, [sessionId]);

  const submitAnswer = () => {
    if (selectedAnswer !== null) {
      const answerRef = ref(database, `sessions/${sessionId}/quiz/answers/${Date.now()}`);
      set(answerRef, { answer: selectedAnswer, studentId: 'student1' }); // TODO: Use actual student ID
    }
  };

  if (isTeacher) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Quiz Control</h2>
        {questions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">{questions[currentQuestion].question}</h3>
            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                  {questions[currentQuestion].correctAnswer === index && (
                    <span className="ml-2 text-green-600">✓</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold">Student Answers:</h4>
              {Object.entries(answers).map(([key, answer]) => (
                <div key={key}>Answer: {String.fromCharCode(65 + answer)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quiz</h2>
      {questions.length > 0 && currentQuestion < questions.length && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{questions[currentQuestion].question}</h3>
          <div className="space-y-2">
            {questions[currentQuestion].options.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={selectedAnswer === index}
                  onChange={() => setSelectedAnswer(index)}
                  className="mr-2"
                />
                {String.fromCharCode(65 + index)}. {option}
              </label>
            ))}
          </div>
          <button
            onClick={submitAnswer}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={selectedAnswer === null}
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}