import React from "react";
import { createClient } from "@/lib/supabase/server";
import UserList from "@/components/users/UserList";

export const revalidate = 0;

export default async function UsersAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all user profiles
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">User Administration</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review, approve, suspend user registrations, and configure permissions.
        </p>
      </div>

      <UserList initialUsers={(users as any[]) || []} currentUserId={user?.id || ""} />
    </div>
  );
}
