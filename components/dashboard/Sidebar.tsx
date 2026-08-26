"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Award,
  Users,
  Settings,
  History,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    role: string;
    full_name: string;
    organization?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light") || !document.documentElement.classList.contains("dark");
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      setTheme("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  };

  const commonNavigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "coordinator", "viewer"] },
    { name: "Sponsors CRM", href: "/dashboard/sponsors", icon: Award, roles: ["super_admin", "admin", "coordinator", "viewer"] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["super_admin", "admin", "coordinator", "viewer"] },
  ];

  const adminNavigation = [
    { name: "User Approvals", href: "/dashboard/users", icon: ShieldCheck, roles: ["super_admin"] },
    { name: "Audit Center", href: "/dashboard/logs", icon: History, roles: ["super_admin"] },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 md:flex md:flex-col z-50 transition-colors duration-200">
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-900 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 font-black">
            S
          </div>
          <span className="font-bold tracking-tight text-zinc-100">SUPRA SAE</span>
        </Link>
        <button
          onClick={toggleTheme}
          type="button"
          className="p-1.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center"
          title="Toggle Day/Night Mode"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
        {commonNavigation.map((item) => {
          if (!item.roles.includes(user.role)) return null;

          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-zinc-50" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              {item.name}
            </Link>
          );
        })}

        {user.role === "super_admin" && (
          <div className="pt-6 pb-2 px-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Super Admin Panel
            </span>
          </div>
        )}

        {user.role === "super_admin" &&
          adminNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-900 text-zinc-50"
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-zinc-50" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-zinc-900 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-zinc-200 truncate">{user.full_name}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user.organization || "SAEINDIA"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
