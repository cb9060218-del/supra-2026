import React from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500 dark:text-zinc-400" />
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">
          Loading tracker data...
        </p>
      </div>
    </div>
  );
}
