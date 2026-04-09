'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  BarChart3,
  Settings,
  BookOpen,
  LogOut,
  Menu,
  X,
  Box
} from 'lucide-react';
import { Button } from '@classroom/ui-components';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/teacher',
    icon: LayoutDashboard,
    current: true
  },
  {
    name: 'Activities',
    href: '/teacher/activities',
    icon: Activity,
    current: false
  },
  {
    name: 'Models',
    href: '/teacher/models',
    icon: Box,
    current: false
  },
  {
    name: 'Sessions',
    href: '/teacher/sessions',
    icon: BookOpen,
    current: false
  },
  {
    name: 'Participants',
    href: '/teacher/participants',
    icon: Users,
    current: false
  },
  {
    name: 'Analytics',
    href: '/teacher/analytics',
    icon: BarChart3,
    current: false
  },
  {
    name: 'Settings',
    href: '/teacher/settings',
    icon: Settings,
    current: false
  }
];

export function Sidebar({ className }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, userType, logout } = useAuth();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-600 bg-opacity-75 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${className || ''}
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 leading-tight">CHRIST Classroom Engagement</h1>
                <p className="text-xs text-slate-500 font-medium">Faculty Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isCurrent
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className={`mr-3 h-4 w-4 ${isCurrent ? 'text-blue-700' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}

            {userType === 'admin' && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className={`
                  mt-3 flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${pathname.startsWith('/admin')
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <LayoutDashboard className={`mr-3 h-4 w-4 ${pathname.startsWith('/admin') ? 'text-sky-700' : 'text-slate-400'}`} />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <span className="text-sm font-bold text-slate-700">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'F'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.displayName || 'Faculty Member'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || 'faculty@christuniversity.in'}
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}