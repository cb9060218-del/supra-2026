import React from "react";
import { createClient } from "@/lib/supabase/server";
import TaskList from "@/components/tasks/TaskList";

export const revalidate = 0;

export default async function TasksPage() {
  const supabase = await createClient();

  // Retrieve user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "viewer";
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) userRole = profile.role;
  }

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("event_tasks")
    .select("*, users(full_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch users for dropdown assignees
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Team Task Board</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Coordinate event setup tasks, assign tasks to owners, track deadlines, and tag team members using @mentions.
        </p>
      </div>

      <TaskList
        initialTasks={(tasks as any[]) || []}
        users={(users as any[]) || []}
        userRole={userRole}
      />
    </div>
  );
}
