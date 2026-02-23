"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@classroom/ui-components";
import { LucideUser, LucideSettings, LucideBell, LucideShield, LucideLogOut, LucideChevronLeft, LucideCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
          <LucideChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your profile and platform preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
             <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
             <CardContent className="pt-0 -mt-10 px-6 pb-6 text-center">
                <div className="w-20 h-20 rounded-full bg-white p-1 border-4 border-white shadow-md mx-auto relative group">
                   <div className="w-full h-full rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-700">
                      {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
                   </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{user?.displayName || 'Professor'}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{user?.email}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2">
                   <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-xs border border-slate-200 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                      <LucideUser size={16} />
                      View Public Profile
                   </Link>
                   <button 
                     onClick={() => logout()}
                     className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs border border-red-100 shadow-sm transition-all hover:bg-red-100"
                   >
                      <LucideLogOut size={16} />
                      Sign Out Account
                   </button>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                 <LucideUser size={18} className="text-blue-600" />
                 Profile Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                    <Input defaultValue={user?.displayName || "Professor"} className="bg-slate-50 border-slate-200 font-bold text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <Input defaultValue={user?.email || ""} className="bg-slate-100 border-slate-200 font-medium text-slate-500" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional ID</label>
                    <Input defaultValue="CH-FAC-2024-001" className="bg-slate-50 border-slate-200 font-bold text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department</label>
                    <Input defaultValue="Computer Science & Engineering" className="bg-slate-50 border-slate-200 font-bold text-slate-900" />
                  </div>
               </div>
               <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave} variant="primary" className="px-8 font-black text-xs uppercase tracking-widest gap-2">
                    {isSaved ? <LucideCheck size={16} /> : null}
                    {isSaved ? "Saved" : "Save Changes"}
                  </Button>
               </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                 <LucideSettings size={18} className="text-indigo-600" />
                 Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><LucideBell size={18} /></div>
                        <div>
                           <p className="text-sm font-bold text-slate-900">Desktop Notifications</p>
                           <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">Stay updated with classroom activity</p>
                        </div>
                     </div>
                     <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><LucideShield size={18} /></div>
                        <div>
                           <p className="text-sm font-bold text-slate-900">Anonymize Student Data</p>
                           <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">Show initials instead of full names in live sessions</p>
                        </div>
                     </div>
                     <div className="w-12 h-6 bg-slate-200 rounded-full relative shadow-inner cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
