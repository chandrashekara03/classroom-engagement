'use client';

import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Bell
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/teacher',
    icon: LayoutDashboard,
  },
  {
    name: 'Activities',
    href: '/teacher/activities',
    icon: Activity,
  },
  {
    name: 'Sessions',
    href: '/teacher/sessions',
    icon: BookOpen,
  },
  {
    name: 'Participants',
    href: '/teacher/participants',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/teacher/settings',
    icon: Settings,
  }
];

// Theme color
const BRAND = '#1f346b';
const BRAND_LIGHT = '#e8ecf4'; // light tint for backgrounds
const BRAND_HOVER = '#2a4590'; // slightly lighter for hover

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'F';

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center space-x-3 shrink-0">
              <Image
                src="/logo.png"
                alt="CHRIST University Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold leading-tight" style={{ color: BRAND }}>CHRIST Classroom</h1>
                <p className="text-[11px] text-slate-500 font-medium -mt-0.5">Faculty Dashboard</p>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    style={isCurrent ? { backgroundColor: BRAND_LIGHT, color: BRAND } : undefined}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${!isCurrent ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : ''}
                    `}
                  >
                    <Icon
                      className="mr-2 h-4 w-4"
                      style={{ color: isCurrent ? BRAND : undefined }}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right side: Notifications + Account */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-slate-600" />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#ef4444' }}
                />
              </button>

              {/* Account Dropdown */}
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: BRAND_LIGHT, border: `1px solid ${BRAND}33` }}
                  >
                    <span className="text-sm font-bold" style={{ color: BRAND }}>{userInitial}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900 leading-tight truncate max-w-[120px]">
                      {user?.displayName || 'Faculty'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                      {user?.email || 'faculty@christuniversity.in'}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isAccountOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user?.displayName || 'Faculty Member'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user?.email || 'faculty@christuniversity.in'}
                      </p>
                    </div>
                    <Link
                      href="/teacher/settings"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Account Settings
                    </Link>
                    <div className="border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
              >
                {isMobileOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav menu */}
        {isMobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  style={isCurrent ? { backgroundColor: BRAND_LIGHT, color: BRAND } : undefined}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${!isCurrent ? 'text-slate-600 hover:bg-slate-100' : ''}
                  `}
                >
                  <Icon
                    className="mr-3 h-4 w-4"
                    style={{ color: isCurrent ? BRAND : undefined }}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-600/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}