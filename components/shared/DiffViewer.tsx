"use client";

import React from "react";

interface DiffViewerProps {
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
}

export default function DiffViewer({ oldValues, newValues }: DiffViewerProps) {
  const oldVal = oldValues || {};
  const newVal = newValues || {};

  // Gather all unique keys, ignoring meta fields
  const ignoreKeys = ["updated_at", "created_at", "version", "deleted_at", "deleted_by", "updated_by"];
  const allKeys = Array.from(
    new Set([...Object.keys(oldVal), ...Object.keys(newVal)])
  ).filter((k) => !ignoreKeys.includes(k));

  return (
    <div className="rounded-xl border border-zinc-900 overflow-hidden bg-zinc-950 text-xs">
      <div className="grid grid-cols-2 bg-zinc-900/40 border-b border-zinc-900 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
        <div className="px-4 py-2 border-r border-zinc-900">Previous State</div>
        <div className="px-4 py-2">New State</div>
      </div>

      <div className="divide-y divide-zinc-900 max-h-96 overflow-y-auto">
        {allKeys.length === 0 ? (
          <div className="p-4 text-center text-zinc-500">No properties to compare.</div>
        ) : (
          allKeys.map((key) => {
            const oldStr = oldVal[key] === null || oldVal[key] === undefined ? "—" : String(oldVal[key]);
            const newStr = newVal[key] === null || newVal[key] === undefined ? "—" : String(newVal[key]);
            const isChanged = oldVal[key] !== newVal[key];

            const keyDisplay = key.replace("_", " ");

            return (
              <div
                key={key}
                className={`grid grid-cols-2 ${
                  isChanged
                    ? "bg-amber-950/5"
                    : "hover:bg-zinc-900/10"
                }`}
              >
                {/* Left col */}
                <div
                  className={`px-4 py-3 border-r border-zinc-900 truncate ${
                    isChanged ? "text-red-400 font-medium" : "text-zinc-400"
                  }`}
                >
                  <span className="block text-[9px] text-zinc-600 uppercase font-semibold">
                    {keyDisplay}
                  </span>
                  <span className="mt-0.5 block truncate">{oldStr}</span>
                </div>

                {/* Right col */}
                <div
                  className={`px-4 py-3 truncate ${
                    isChanged ? "text-green-400 font-medium" : "text-zinc-400"
                  }`}
                >
                  <span className="block text-[9px] text-zinc-600 uppercase font-semibold">
                    {keyDisplay}
                  </span>
                  <span className="mt-0.5 block truncate">{newStr}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
