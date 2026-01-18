"use client";
import { useState } from "react";
import { socketManager } from "@/lib/socket";
import { supabase } from "@/lib/supabaseClient";

export default function TestPage() {
  const [sessionId, setSessionId] = useState("test-session");
  const [messages, setMessages] = useState<string[]>([]);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  const connect = () => {
    socketManager.connect(sessionId);
    addMessage("Connected to session: " + sessionId);
  };

  const testSupabase = async () => {
    if (!supabase) {
      addMessage("Supabase not configured");
      setSupabaseConnected(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('teachers').select('count').single();
      if (error) throw error;
      addMessage("Supabase connected successfully");
      setSupabaseConnected(true);
    } catch (err) {
      addMessage("Supabase error: " + (err as Error).message);
      setSupabaseConnected(false);
    }
  };

  const emitEvent = (event: string, payload: any) => {
    socketManager.emit(event, payload);
    addMessage(`Emitted ${event}: ${JSON.stringify(payload)}`);
  };

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, new Date().toLocaleTimeString() + ": " + msg]);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass p-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            🧪 Real-Time Testing Mode
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">Test socket connections, Supabase integration, and real-time events</p>
        </div>

        {/* Connection Status */}
        <div className="glass p-6 animate-fade-in">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button
              onClick={testSupabase}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              🔗 Test Supabase
            </button>
            <div className="flex items-center gap-2">
              <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                supabaseConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {supabaseConnected ? '✅ Connected' : '❌ Disconnected'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="glass border-0 px-4 py-2 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Session ID"
            />
            <button
              onClick={connect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              🔌 Connect Socket
            </button>
          </div>
        </div>

        {/* Event Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Teacher Events */}
          <div className="glass p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">👨‍🏫 Teacher Events</h2>
            <div className="space-y-3">
              <button
                onClick={() => emitEvent("SESSION_START", { sessionId })}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                🚀 Start Session
              </button>
              <button
                onClick={() => emitEvent("QUESTION_START", { index: 0 })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                ❓ Start Question 1
              </button>
              <button
                onClick={() => emitEvent("ANSWER_REVEAL", { index: 0 })}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                👁️ Reveal Answer
              </button>
              <button
                onClick={() => emitEvent("SESSION_END", {})}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                🛑 End Session
              </button>
            </div>
          </div>

          {/* Student Events */}
          <div className="glass p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">👨‍🎓 Student Events</h2>
            <div className="space-y-3">
              <button
                onClick={() => emitEvent("ANSWER_SUBMITTED", { questionIndex: 0, answer: "A" })}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                📝 Submit Answer "A"
              </button>
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="glass p-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-neutral-100">📋 Event Log</h2>
          <div className="glass p-4 h-64 overflow-y-auto bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm text-neutral-700 dark:text-neutral-300 font-mono mb-1">
                {msg}
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-neutral-500 dark:text-neutral-400 text-center py-8">
                No events logged yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
