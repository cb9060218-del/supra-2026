"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Award,
  Layers,
  Shirt,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  user: {
    role: string;
  };
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin", "coordinator", "viewer"] },
    { name: "Sponsors", href: "/dashboard/sponsors", icon: Award, roles: ["super_admin", "admin", "coordinator", "viewer"] },
    { name: "Stickers", href: "/dashboard/stickers", icon: Layers, roles: ["super_admin", "admin", "coordinator", "viewer"] },
    { name: "Kits", href: "/dashboard/kits", icon: Shirt, roles: ["super_admin", "admin", "coordinator", "viewer"] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["super_admin", "admin", "coordinator", "viewer"] },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 px-4 py-2 flex justify-around items-center md:hidden z-50 shadow-lg transition-colors duration-200">
      {navigation.map((item) => {
        if (!item.roles.includes(user.role)) return null;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors",
              isActive
                ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-900"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 mb-0.5 transition-colors",
                isActive ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500"
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
