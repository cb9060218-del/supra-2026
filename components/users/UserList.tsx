"use client";

import React, { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, UserPlus, Trash, Shield, ArrowUpRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { verifyUserAction, updateUserRoleAction, toggleUserActiveAction } from "@/app/dashboard/users/actions";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  organization?: string;
  is_verified: boolean;
  is_active: boolean;
  is_founder: boolean;
  created_at: string;
}

interface UserListProps {
  initialUsers: Profile[];
  currentUserId: string;
}

export default function UserList({ initialUsers, currentUserId }: UserListProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  // State for prompt change reason
  const [promptUserId, setPromptUserId] = useState<string | null>(null);
  const [promptAction, setPromptAction] = useState<"approve" | "revoke" | "role" | "suspend" | "unsuspend" | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpenPrompt = (userId: string, act: any, initialRole = "") => {
    setPromptUserId(userId);
    setPromptAction(act);
    setReason("");
    setError(null);
    if (initialRole) setSelectedRole(initialRole);
  };

  const handleConfirm = () => {
    if (!promptUserId || !promptAction || !reason.trim()) {
      setError("Please write down a justification reason.");
      return;
    }

    startTransition(async () => {
      let res;
      if (promptAction === "approve") {
        res = await verifyUserAction(promptUserId, true, reason);
        if (!res.error) {
          setUsers((prev) =>
            prev.map((u) => (u.id === promptUserId ? { ...u, is_verified: true } : u))
          );
        }
      } else if (promptAction === "revoke") {
        res = await verifyUserAction(promptUserId, false, reason);
        if (!res.error) {
          setUsers((prev) =>
            prev.map((u) => (u.id === promptUserId ? { ...u, is_verified: false } : u))
          );
        }
      } else if (promptAction === "suspend") {
        res = await toggleUserActiveAction(promptUserId, false, reason);
        if (!res.error) {
          setUsers((prev) =>
            prev.map((u) => (u.id === promptUserId ? { ...u, is_active: false } : u))
          );
        }
      } else if (promptAction === "unsuspend") {
        res = await toggleUserActiveAction(promptUserId, true, reason);
        if (!res.error) {
          setUsers((prev) =>
            prev.map((u) => (u.id === promptUserId ? { ...u, is_active: true } : u))
          );
        }
      } else if (promptAction === "role") {
        res = await updateUserRoleAction(promptUserId, selectedRole as any, reason);
        if (!res.error) {
          setUsers((prev) =>
            prev.map((u) => (u.id === promptUserId ? { ...u, role: selectedRole } : u))
          );
        }
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setPromptUserId(null);
        setPromptAction(null);
        setReason("");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Users grid table */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Organization</th>
                <th className="px-6 py-3.5">Registration Date</th>
                <th className="px-6 py-3.5">Verification</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Account State</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-zinc-900/20 transition-colors ${
                    !u.is_active ? "opacity-60 bg-red-950/5" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
                          {u.full_name}
                          {u.is_founder && (
                            <span className="rounded bg-yellow-950 text-yellow-400 border border-yellow-900 px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider">
                              Founder
                            </span>
                          )}
                          {u.id === currentUserId && (
                            <span className="text-[10px] text-zinc-500 font-normal italic">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{u.organization || "SAEINDIA"}</td>
                  <td className="px-6 py-4 text-zinc-500">{formatDateTime(u.created_at)}</td>
                  <td className="px-6 py-4">
                    {u.is_verified ? (
                      <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> Approved
                      </span>
                    ) : (
                      <span className="text-yellow-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4" /> Pending Approval
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      disabled={u.is_founder || u.id === currentUserId}
                      onChange={(e) => handleOpenPrompt(u.id, "role", e.target.value)}
                      className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 focus:outline-none disabled:opacity-50"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_active ? (
                      <span className="text-zinc-300">Active</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Suspended</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* Verification toggles */}
                      {!u.is_verified ? (
                        <button
                          onClick={() => handleOpenPrompt(u.id, "approve")}
                          disabled={u.is_founder}
                          className="rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenPrompt(u.id, "revoke")}
                          disabled={u.is_founder || u.id === currentUserId}
                          className="rounded border border-zinc-850 text-zinc-400 hover:text-zinc-200 px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}

                      {/* Suspension toggles */}
                      {u.is_active ? (
                        <button
                          onClick={() => handleOpenPrompt(u.id, "suspend")}
                          disabled={u.is_founder || u.id === currentUserId}
                          className="rounded border border-red-950/50 text-red-400 hover:text-red-300 px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenPrompt(u.id, "unsuspend")}
                          disabled={u.is_founder}
                          className="rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Justification Reason prompt modal */}
      {promptUserId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-zinc-400" /> Audit Access Log Change
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every profile modification must be traceable. Please write down a justification reason.
            </p>

            {error && (
              <div className="text-[10px] text-red-450 text-red-400 bg-red-950/25 border border-red-900/35 p-2 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-zinc-555 text-zinc-500 uppercase tracking-wider">
                Reason / Remarks (Required)
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Verifying new chief coordinator for guest registrations"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPromptUserId(null);
                  setPromptAction(null);
                  setReason("");
                  setError(null);
                }}
                className="rounded border border-zinc-850 px-4 py-2 text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || !reason.trim()}
                className="rounded bg-zinc-100 text-zinc-950 px-4 py-2 text-[10px] font-bold transition-colors disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
