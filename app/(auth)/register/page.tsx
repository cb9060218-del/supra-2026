"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-950 font-black text-xl tracking-tight shadow-md">
            S
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-100">
            Request Access
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Register as a committee member or event coordinator
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-sm">
          {state?.error && (
            <div className="mb-4 rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-xs text-red-400">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400">Full Name</label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="Rahul Sharma"
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="rahul@saeindia.org"
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 9876543210"
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Organization</label>
                <input
                  type="text"
                  name="organization"
                  placeholder="SAEINDIA Committee"
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400">Password</label>
              <input
                type="password"
                name="password"
                required
                placeholder="Min. 6 characters"
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400">Desired Role</label>
              <select
                name="role"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="coordinator">Coordinator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="text-xs text-zinc-400 leading-normal">
              By requesting access, you acknowledge that your profile must be approved by an administrator before you can log in to the system.
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex w-full justify-center rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {isPending ? "Submitting Request..." : "Request Access"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-zinc-200 hover:text-white underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
