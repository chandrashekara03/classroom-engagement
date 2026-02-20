"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@classroom/ui-components";
import { LucideBarChart4, LucideDownload, LucideUsers, LucideActivity, LucideTrendingUp, LucideArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const loadedSessions = JSON.parse(localStorage.getItem('classroom_sessions') || '[]');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/')}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <Link href={`/session/${session.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
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
