"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, User, Clock, CheckCircle2, Circle, AlertTriangle, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/dashboard/tasks/actions";

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority: string;
  deadline?: string;
  status: string;
  version: number;
  users?: {
    full_name: string;
  };
}

interface TaskListProps {
  initialTasks: Task[];
  users: { id: string; full_name: string }[];
  userRole: string;
}

export default function TaskList({ initialTasks, users, userRole }: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<any>("medium");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<any>("todo");
  const [changeReason, setChangeReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleOpenAdd = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
    setDeadline("");
    setStatus("todo");
    setError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setAssignedTo(t.assigned_to || "");
    setPriority(t.priority as any);
    setDeadline(t.deadline ? t.deadline.substring(0, 16) : "");
    setStatus(t.status as any);
    setChangeReason("");
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (editingTask && !changeReason.trim()) {
      setError("Please write down a justification reason.");
      return;
    }

    const payload = {
      id: editingTask?.id,
      title,
      description,
      assigned_to: assignedTo || null,
      priority,
      deadline: deadline || null,
      status,
      version: editingTask?.version,
      change_reason: changeReason || undefined,
    };

    startTransition(async () => {
      let res;
      if (editingTask) {
        res = await updateTaskAction(payload);
      } else {
        res = await createTaskAction(payload);
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setIsAddOpen(false);
        setEditingTask(null);
        router.refresh();
      }
    });
  };

  const handleQuickToggle = (task: Task) => {
    if (!isWritable) return;
    const nextStatus = task.status === "completed" ? "todo" : "completed";

    startTransition(async () => {
      const res = await updateTaskAction({
        id: task.id,
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to,
        priority: task.priority,
        deadline: task.deadline,
        status: nextStatus,
        version: task.version,
        change_reason: `Quick toggle status to ${nextStatus}`,
      });

      if (!res.error) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: nextStatus, version: t.version + 1 } : t
          )
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    startTransition(async () => {
      const res = await deleteTaskAction(id, "Deleted task from dashboard");
      if (!res.error) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    });
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "critical":
        return "text-red-500 bg-red-950/20 border-red-900";
      case "high":
        return "text-orange-500 bg-orange-950/20 border-orange-900";
      case "medium":
        return "text-amber-500 bg-amber-950/20 border-amber-900";
      default:
        return "text-zinc-400 bg-zinc-900 border-zinc-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-900 bg-zinc-900/30 pl-10 pr-4 py-2 text-sm text-zinc-150 placeholder-zinc-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-900 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All States</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {isWritable && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Grid of Tasks */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-555 text-zinc-500 text-xs">
            No active tasks found matching criteria.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border border-zinc-900 p-5 space-y-4 flex flex-col justify-between transition-all ${
                t.status === "completed" ? "bg-zinc-900/10 opacity-70" : "bg-zinc-900/20"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleQuickToggle(t)}
                      disabled={!isWritable || isPending}
                      className="mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
                    >
                      {t.status === "completed" ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <Circle className="h-4.5 w-4.5" />
                      )}
                    </button>
                    <p
                      className={`text-xs font-bold text-zinc-150 leading-snug ${
                        t.status === "completed" ? "line-through text-zinc-500" : ""
                      }`}
                    >
                      {t.title}
                    </p>
                  </div>

                  <span
                    className={`rounded px-1.5 py-0.2 border text-[8px] uppercase font-bold tracking-wide flex-shrink-0 ${getPriorityColor(
                      t.priority
                    )}`}
                  >
                    {t.priority}
                  </span>
                </div>

                {t.description && (
                  <p className="text-[11px] text-zinc-400 pl-7 leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                )}
              </div>

              <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-between text-[10px] text-zinc-550 text-zinc-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="h-3.5 w-3.5" /> {t.users?.full_name || "Unassigned"}
                  </span>
                  {t.deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(t.deadline)}
                    </span>
                  )}
                </div>

                {isWritable && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="text-zinc-500 hover:text-zinc-300 font-semibold"
                    >
                      Edit
                    </button>
                    {userRole === "super_admin" && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-500 hover:text-red-400 font-semibold"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {(isAddOpen || editingTask) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">
              {editingTask ? "Edit Team Task" : "Add Team Task"}
            </h3>

            {error && (
              <div className="rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Set up pit stall electricity connections"
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-150 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Task Description (Use @Name to alert team members)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Please coordinate with @Rahul to inspect trackside cables..."
                  className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-150 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Assigned Owner
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Deadline Date
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-350 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Progress State
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {editingTask && (
                <div className="rounded-lg border border-yellow-900/40 bg-yellow-950/15 p-4 space-y-2">
                  <label className="block text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                    Reason for Change (Required)
                  </label>
                  <input
                    type="text"
                    required
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="e.g. Extended deadline due to track inspection delays"
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-150 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingTask(null);
                  }}
                  className="rounded-lg border border-zinc-855 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingTask ? "Update Task" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
