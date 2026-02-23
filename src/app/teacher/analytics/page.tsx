"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@classroom/ui-components";
import { LucideBarChart4, LucideDownload, LucideUsers, LucideActivity, LucideTrendingUp, LucideArrowLeft, LucidePieChart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

interface StoredSession {
  id: string;
  code: string;
  templateId: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    const loadedSessions = JSON.parse(localStorage.getItem('classroom_sessions') || '[]') as StoredSession[];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(loadedSessions);
  }, []);

  const handleExportCSV = () => {
    // Generate simple CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Session ID,Title,Status,Responses\n";
    sessions.forEach(s => {
      csvContent += `${s.id},${s.title},${s.status},0\n`; // Dummy resp count for now
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "classroom_analytics_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
  const activeSessions = sessions.filter(s => s.status === 'LIVE').length;
  const totalSessions = sessions.length;

  const chartData = [
    { name: "0-20%", students: 4 },
    { name: "21-40%", students: 7 },
    { name: "41-60%", students: 12 },
    { name: "61-80%", students: 28 },
    { name: "81-100%", students: 43 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/teacher')}>
          <LucideArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics Overview</h1>
          <p className="text-slate-500">View participation metrics and export session data.</p>
        </div>
        <div className="flex-1"></div>
        <Button onClick={handleExportCSV} className="flex items-center gap-2">
          <LucideDownload size={18} />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Sessions</CardTitle>
            <LucideActivity size={18} className="text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}</div>
            <p className="text-xs text-slate-500 mt-1">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Live & Scheduled</CardTitle>
            <LucideBarChart4 size={18} className="text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions - completedSessions}</div>
            <p className="text-xs text-emerald-600 mt-1 font-medium">{activeSessions} currently live</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completed Sessions</CardTitle>
            <LucideTrendingUp size={18} className="text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedSessions}</div>
            <p className="text-xs text-slate-500 mt-1">Archived session data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Participants</CardTitle>
            <LucideUsers size={18} className="text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">247</div>
            <p className="text-xs text-blue-600 mt-1 font-medium">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucideBarChart4 size={18} className="text-blue-600" />
              Global Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-slate-500 text-center mt-4">Distribution of average scores across all Quiz activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucidePieChart size={18} className="text-indigo-600" />
              Activity Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-64 mt-4">
               {/* Simplified representation for prototype without importing full PieChart */}
               <div className="flex w-full h-8 rounded-full overflow-hidden shadow-sm mb-8">
                 <div className="bg-blue-500 w-1/2 flex items-center justify-center text-white text-xs font-bold">50% Quizzes</div>
                 <div className="bg-indigo-400 w-1/4 flex items-center justify-center text-white text-xs font-bold">25% Polls</div>
                 <div className="bg-amber-400 w-1/6 flex items-center justify-center text-white text-xs font-bold">15% Feedback</div>
                 <div className="bg-emerald-400 w-1/12 flex items-center justify-center text-white text-xs font-bold">10%</div>
               </div>
               
               <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full px-8 text-sm">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> <span className="text-slate-700 font-medium">Quizzes (50%)</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-400"></div> <span className="text-slate-700 font-medium">Polls (25%)</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div> <span className="text-slate-700 font-medium">Feedback (15%)</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> <span className="text-slate-700 font-medium">Grouping (10%)</span></div>
               </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucideTrendingUp size={18} className="text-emerald-600" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Average Response Time</span>
              <span className="text-sm font-bold text-slate-900">2.3 min</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '77%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Completion Rate</span>
              <span className="text-sm font-bold text-slate-900">89%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Student Satisfaction</span>
              <span className="text-sm font-bold text-slate-900">4.6/5</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Advanced Calculus Quiz</p>
                  <p className="text-sm text-slate-600">Mathematics • 94% avg score</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">94%</p>
                  <p className="text-xs text-slate-500">28 responses</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Literature Analysis Poll</p>
                  <p className="text-sm text-slate-600">English • 87% participation</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">87%</p>
                  <p className="text-xs text-slate-500">32 responses</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Group Project Feedback</p>
                  <p className="text-sm text-slate-600">General • 4.8/5 rating</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-600">4.8</p>
                  <p className="text-xs text-slate-500">19 responses</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">This Week</span>
                <span className="text-sm font-bold text-slate-900">+23% engagement</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Quiz Completion</span>
                <span className="text-sm font-bold text-slate-900">91% avg</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Response Speed</span>
                <span className="text-sm font-bold text-slate-900">2.1 min avg</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Student Retention</span>
                <span className="text-sm font-bold text-slate-900">96% active</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-4 py-3">Session Title</th>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No sessions found. Create one from the Dashboard.</td>
                  </tr>
                )}
                {sessions.map(session => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{session.title}</td>
                    <td className="px-4 py-3 text-slate-600">{session.templateId.split('-')[0].toUpperCase()}</td>
                    <td className="px-4 py-3"><span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{session.code}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' :
                        session.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {session.status || 'SCHEDULED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/teacher/session/${session.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
