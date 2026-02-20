"use client";

import { useState } from 'react';

export default function StudentInterface() {
  const [sessionCode, setSessionCode] = useState('');
  const [studentName, setStudentName] = useState('');

  const joinSession = () => {
    // TODO: Join session
    console.log('Joining session:', sessionCode, 'as', studentName);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Join Classroom Session</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-full p-3 border rounded"
          />
          <input
            type="text"
            placeholder="Session Code"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            className="w-full p-3 border rounded"
          />
          <button
            onClick={joinSession}
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700"
          >
            Join Session
          </button>
        </div>
      </div>
    </div>
  );
}