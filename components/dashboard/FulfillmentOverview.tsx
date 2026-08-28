"use client";

import React, { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Box, ShieldAlert } from "lucide-react";

interface FulfillmentItem {
  id: string;
  category: "stall" | "stickers" | "kits";
  company_name: string;
}

interface FulfillmentOverviewProps {
  initialItems: FulfillmentItem[];
  userRole: string;
}

const CATEGORIES = [
  { key: "stall", title: "Stall Setup", sub: "Companies that need a stall set up onsite" },
  { key: "stickers", title: "Vehicle Stickers", sub: "Companies wanting their sticker on student cars" },
  { key: "kits", title: "Materials in Student Kits", sub: "Companies providing material for kits" },
] as const;

export default function FulfillmentOverview({ initialItems, userRole }: FulfillmentOverviewProps) {
  const [items, setItems] = useState<FulfillmentItem[]>(initialItems);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);
  const supabase = createClient();

  const handleAddItem = async (category: "stall" | "stickers" | "kits") => {
    const val = inputs[category]?.trim();
    if (!val) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from("fulfillment_items")
        .insert({ category, company_name: val })
        .select()
        .single();

      if (!error && data) {
        setItems((prev) => [...prev, data]);
        setInputs((prev) => ({ ...prev, [category]: "" }));
      }
    });
  };

  const handleRemoveItem = async (id: string) => {
    if (!confirm("Are you sure you want to remove this company from the list?")) return;

    startTransition(async () => {
      const { error } = await supabase.from("fulfillment_items").delete().eq("id", id);
      if (!error) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-2">
        <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Box className="h-4 w-4" /> Benefit Fulfillment Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const categoryItems = items.filter((item) => item.category === cat.key);

          return (
            <div
              key={cat.key}
              className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{cat.title}</h3>
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {categoryItems.length}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-4">{cat.sub}</p>

                <div className="flex flex-wrap gap-2 mb-6 min-h-[36px]">
                  {categoryItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 px-3 py-1 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/40"
                    >
                      {item.company_name}
                      {isWritable && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isPending}
                          className="hover:text-red-500 text-zinc-400 font-bold transition-all focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {categoryItems.length === 0 && (
                    <span className="text-xs text-zinc-400 italic">None added yet</span>
                  )}
                </div>
              </div>

              {isWritable ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add company name"
                    value={inputs[cat.key] || ""}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddItem(cat.key);
                    }}
                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                  />
                  <button
                    onClick={() => handleAddItem(cat.key)}
                    disabled={isPending || !inputs[cat.key]?.trim()}
                    className="rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs p-1.5 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <ShieldAlert className="h-3.5 w-3.5" /> Read-only member permission
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
