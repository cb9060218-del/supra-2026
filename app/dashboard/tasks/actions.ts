"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TaskSchema } from "@/lib/validators";

async function processMentions(description: string, taskTitle: string, editorName: string, supabase: any) {
  if (!description) return;

  // Simple regex to find words starting with @: e.g. @Rahul, @Ananya, @Chandan B
  // We can look for anything like @[Name] or @Name (allowing spaces if wrapped or just simple alphabets)
  // Let's do simple word detection: e.g. @Rahul or @Chandan
  const matches = description.match(/@(\w+)/g);
  if (!matches) return;

  const names = matches.map((m) => m.substring(1).toLowerCase());

  // Retrieve active users to match names
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name")
    .is("deleted_at", null);

  if (!users) return;

  const matchedUsers = users.filter((u: any) => {
    const firstName = u.full_name.split(" ")[0].toLowerCase();
    const fullName = u.full_name.toLowerCase();
    return names.includes(firstName) || names.some((n) => fullName.includes(n));
  });

  if (matchedUsers.length > 0) {
    const notifications = matchedUsers.map((u: any) => ({
      user_id: u.id,
      title: "Task Mentions Alert",
      message: `${editorName} mentioned you in task: "${taskTitle}"`,
    }));

    await supabase.from("notifications").insert(notifications);
  }
}

export async function createTaskAction(data: any) {
  const validation = TaskSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const payload = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (payload.change_reason) {
    await supabase.rpc("set_change_reason", { reason: payload.change_reason });
  }

  const { data: newTask, error } = await supabase
    .from("event_tasks")
    .insert({
      title: payload.title,
      description: payload.description || null,
      assigned_to: payload.assigned_to || null,
      priority: payload.priority,
      deadline: payload.deadline || null,
      status: payload.status,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Parse mentions in description
  if (payload.description && profile) {
    await processMentions(payload.description, payload.title, profile.full_name, supabase);
  }

  revalidatePath("/dashboard/tasks");
  return { success: true };
}

export async function updateTaskAction(data: any) {
  const validation = TaskSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const payload = validation.data;
  if (!payload.id) return { error: "Task ID is required" };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Fetch current version to prevent conflicts
  const { data: current } = await supabase
    .from("event_tasks")
    .select("version")
    .eq("id", payload.id)
    .is("deleted_at", null)
    .single();

  if (!current) return { error: "Task not found" };

  if (current.version !== payload.version) {
    return { error: "conflict" };
  }

  if (payload.change_reason) {
    await supabase.rpc("set_change_reason", { reason: payload.change_reason });
  }

  const { error } = await supabase
    .from("event_tasks")
    .update({
      title: payload.title,
      description: payload.description || null,
      assigned_to: payload.assigned_to || null,
      priority: payload.priority,
      deadline: payload.deadline || null,
      status: payload.status,
      version: current.version + 1,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("version", payload.version);

  if (error) return { error: error.message };

  // Parse mentions in description
  if (payload.description && profile) {
    await processMentions(payload.description, payload.title, profile.full_name, supabase);
  }

  revalidatePath("/dashboard/tasks");
  return { success: true };
}

export async function deleteTaskAction(id: string, reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase
    .from("event_tasks")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/tasks");
  return { success: true };
}
