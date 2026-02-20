"use client";

import { useState } from 'react';

export default function TeacherDashboard() {
  const [sessionName, setSessionName] = useState('');
  const [activityType, setActivityType] = useState('quiz');

  const createSession = () => {
    // TODO: Create session in Firebase
    console.log('Creating session:', sessionName, activityType);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teacher Dashboard</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Session Name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="quiz">Quiz</option>
              <option value="poll">Poll</option>
              <option value="grouping">Group Formation</option>
              <option value="feedback">Feedback</option>
            </select>
            <button
              onClick={createSession}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Session
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
          {/* TODO: List active sessions */}
          <p className="text-gray-500">No active sessions</p>
        </div>
      </div>
    </div>
  );
}