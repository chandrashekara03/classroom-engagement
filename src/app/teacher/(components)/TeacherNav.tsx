"use client";
import Link from "next/link";
import { useNavigation } from "@/lib/navigation-context";

export default function TeacherNav() {
  const { userType } = useNavigation();

  if (userType !== "teacher") return null;

  return (
    <nav className="glass m-4 p-4 rounded-xl animate-slide-up">
      <div className="flex space-x-6">
        <Link href="/teacher/dashboard" className="text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Dashboard
        </Link>
        <Link href="/teacher/templates" className="text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Templates
        </Link>
        <Link href="/teacher/analytics" className="text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Analytics
        </Link>
        <Link href="/" className="text-neutral-900 dark:text-neutral-100 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          Logout
        </Link>
      </div>
    </nav>
  );
}