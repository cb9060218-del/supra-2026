"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  read_status: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  userId: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setNotifications(data);
    }

    fetchNotifications();
  }, [userId, supabase]);

  // Subscribe to Realtime notifications
  useEffect(() => {
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);

          // Play notification sound
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
            audio.volume = 0.3;
            audio.play();
          } catch (e) {
            console.log("Audio play blocked");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_status).map((n) => n.id);
    if (unreadIds.length === 0) return;

    // Update locally
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_status: true }))
    );

    // Update in database
    await supabase
      .from("notifications")
      .update({ read_status: true })
      .in("id", unreadIds);
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;

    setNotifications([]);

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-950/50">
            <h3 className="text-xs font-bold text-zinc-200">Alert Center</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5"
                  title="Mark all as read"
                >
                  <Check className="h-3 w-3" /> Read All
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
                  title="Clear all"
                >
                  <Trash className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-900">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-500">
                No active notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 text-left transition-colors ${
                    notif.read_status ? "bg-transparent" : "bg-zinc-800/35"
                  }`}
                >
                  <p className="text-xs font-semibold text-zinc-200">{notif.title}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                    {notif.message}
                  </p>
                  <p className="text-[9px] text-zinc-500 mt-1">
                    {new Date(notif.created_at).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
