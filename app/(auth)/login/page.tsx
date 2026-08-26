"use client";

import React, { Suspense, useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { loginAction } from "../actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const successParam = searchParams.get("success");

  const [state, formAction, isPendingPassword] = useActionState(loginAction, null);

  const [showPassword, setShowPassword] = useState(false);
  const [demoRole, setDemoRole] = useState<"super_admin" | "admin">("super_admin");
  const [email, setEmail] = useState("cb9060218@gmail.com");
  const [password, setPassword] = useState("password123");
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

  const handleSelectRole = (role: "super_admin" | "admin") => {
    setDemoRole(role);
    if (role === "super_admin") {
      setEmail("cb9060218@gmail.com");
      setPassword("password123");
    } else {
      setEmail("admin@supra2026.com");
      setPassword("password123");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Day / Night Mode Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 dark:border-zinc-800 dark:bg-zinc-900/50 light:bg-white light:border-zinc-200 text-zinc-400 hover:text-zinc-200 light:text-zinc-600 light:hover:text-zinc-800 transition-all shadow-sm"
        title="Toggle Day/Night Mode"
      >
        {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-950 font-black text-xl tracking-tight shadow-md">
            S
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 light:text-zinc-900">
            SUPRA SAEINDIA 2026
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            Sponsor, Guest, Benefits, and Event Portal
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 bg-zinc-900/50 dark:bg-zinc-900/50 light:bg-white p-8 shadow-xl backdrop-blur-sm">
          {/* Super Admin / Admin Switcher Tab */}
          <div className="mb-6 p-2 rounded-lg bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-100 border border-zinc-850 dark:border-zinc-850 light:border-zinc-200 space-y-2">
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
              Choose Evaluation Profile
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "super_admin", label: "Super Admin" },
                { id: "admin", label: "Admin" },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role.id as any)}
                  className={`rounded-lg py-2.5 text-xs font-bold tracking-wide transition-all border ${
                    demoRole === role.id
                      ? "bg-zinc-100 border-zinc-100 text-zinc-950 dark:bg-zinc-100 dark:text-zinc-950 light:bg-zinc-900 light:text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 light:bg-zinc-200 light:border-zinc-300 light:text-zinc-650 light:text-zinc-600 light:hover:text-zinc-800"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Success messages */}
          {successParam && (
            <div className="mb-4 rounded-lg bg-green-950/20 dark:bg-green-950/20 light:bg-green-50 border border-green-900/30 dark:border-green-900/30 light:border-green-200 p-3 text-xs text-green-400 light:text-green-700">
              {successParam}
            </div>
          )}

          {/* Error messages from redirection */}
          {(errorParam || state?.error) && (
            <div className="mb-4 rounded-lg bg-red-950/50 dark:bg-red-950/50 light:bg-red-50 border border-red-900/50 dark:border-red-900/50 light:border-red-200 p-3 text-xs text-red-400 light:text-red-750 light:text-red-700">
              {state?.error || errorParam}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 light:text-zinc-500">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-50 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 light:text-zinc-500">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 bg-zinc-950 dark:bg-zinc-950 light:bg-zinc-50 pl-3 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-650 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 light:text-zinc-400 light:hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPendingPassword}
              className="mt-6 flex w-full justify-center rounded-lg bg-zinc-100 dark:bg-zinc-100 light:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-200 light:hover:bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-950 light:text-white focus:outline-none disabled:opacity-50 transition-all shadow-sm"
            >
              {isPendingPassword ? "Verifying..." : `Sign In as ${demoRole === "super_admin" ? "Super Admin" : "Admin"}`}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
              Need access?{" "}
              <Link href="/register" className="font-semibold text-zinc-900 dark:text-zinc-200 light:text-zinc-900 hover:underline">
                Register a new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
