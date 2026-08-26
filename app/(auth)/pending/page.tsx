"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "../actions";

export default function PendingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCheckStatus = () => {
    startTransition(() => {
      // Re-trigger server-side redirects in middleware by refreshing the current page
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-yellow-500 shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="h-8 w-8 animate-pulse"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Approval Pending
          </h2>
          <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
            Your account is pending administrator approval. Please coordinate with a Super Admin to verify your credentials.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <button
            onClick={handleCheckStatus}
            disabled={isPending}
            className="w-full justify-center rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isPending ? "Checking status..." : "Check Status"}
          </button>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-zinc-400 hover:text-zinc-200 text-xs py-1 transition-colors"
            >
              Sign out and return to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
