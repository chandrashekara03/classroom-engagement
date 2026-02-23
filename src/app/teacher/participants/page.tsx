"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@classroom/ui-components";
import { LucideUsers, LucideSearch, LucideMail, LucideAward, LucideActivity, LucideChevronLeft, LucideDownload } from "lucide-react";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  email: string;
  status: string;
  sessions: number;
  avgScore: number;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // For a real app, this would fetch from a database. 
    // For the prototype, we'll use mock data.
    const mockData = [
      { id: '1', name: 'Alice Johnson', email: 'alice.j@student.christuniversity.in', status: 'Active', sessions: 12, avgScore: 88 },
      { id: '2', name: 'Bob Smith', email: 'bob.s@student.christuniversity.in', status: 'Inactive', sessions: 8, avgScore: 72 },
      { id: '3', name: 'Carol Davis', email: 'carol.d@student.christuniversity.in', status: 'Active', sessions: 15, avgScore: 94 },
      { id: '4', name: 'David Wilson', email: 'david.w@student.christuniversity.in', status: 'Active', sessions: 10, avgScore: 67 },
      { id: '5', name: 'Eva Brown', email: 'eva.b@student.christuniversity.in', status: 'Active', sessions: 14, avgScore: 81 },
      { id: '6', name: 'Frank Miller', email: 'frank.m@student.christuniversity.in', status: 'Away', sessions: 6, avgScore: 79 },
    ];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticipants(mockData);
  }, []);

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
            <LucideChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Participant Directory</h1>
            <p className="text-sm text-slate-500 font-medium">Monitor student attendance and overall performance</p>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <LucideDownload size={18} />
          Export Directory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatSummaryCard title="Total Students" value={participants.length.toString()} icon={<LucideUsers className="text-blue-600" />} />
        <StatSummaryCard title="Avg. Attendance" value="84%" icon={<LucideActivity className="text-emerald-600" />} />
        <StatSummaryCard title="Avg. Score" value="80.2" icon={<LucideAward className="text-amber-600" />} />
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between px-6 py-4">
          <CardTitle>Roster</CardTitle>
          <div className="relative w-64">
            <LucideSearch className="absolute left-3 top-2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium text-slate-900"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sessions</th>
                  <th className="px-6 py-4">Avg. Score</th>
                  <th className="px-6 py-4 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map(participant => (
                  <tr key={participant.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border border-blue-200 shadow-sm">
                          {participant.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{participant.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium font-mono">{participant.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        participant.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        participant.status === 'Away' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          participant.status === 'Active' ? 'bg-emerald-500' :
                          participant.status === 'Away' ? 'bg-amber-500' :
                          'bg-slate-300'
                        }`}></span>
                        {participant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{participant.sessions}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{participant.avgScore}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              participant.avgScore >= 90 ? 'bg-emerald-500' :
                              participant.avgScore >= 75 ? 'bg-blue-500' :
                              'bg-amber-500'
                            }`}
                            style={{ width: `${participant.avgScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <LucideMail size={16} />
                      </button>
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

function StatSummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
