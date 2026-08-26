import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import { signOutAction } from "../(auth)/actions";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_verified) {
    redirect("/pending");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200">
      {/* Sidebar for Desktop & Tablet */}
      <Sidebar user={profile} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 pb-20 md:pb-0">
        {/* Header bar */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-900 px-6 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wider uppercase text-zinc-400">
              SUPRA SAEINDIA 2026
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter userId={profile.id} />

            <div className="flex items-center gap-3 pl-2 border-l border-zinc-900">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-zinc-200">{profile.full_name}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {profile.role.replace("_", " ")}
                </p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  title="Sign Out"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Touch Bottom Navbar for Mobile */}
      <BottomNav user={profile} />
    </div>
  );
}
