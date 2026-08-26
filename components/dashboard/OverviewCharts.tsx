"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ChartData {
  tierData: { name: string; value: number }[];
  guestData: { name: string; value: number }[];
}

export default function OverviewCharts({ tierData, guestData }: ChartData) {
  const COLORS = ["#8b5cf6", "#64748b", "#f59e0b", "#ea580c", "#71717a", "#eab308", "#3b82f6"];
  const GUEST_COLORS = ["#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Revenue by Tier Bar Chart */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-6">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">
          Sponsorship Revenue by Tier (INR)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tierData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                labelStyle={{ color: "#f4f4f5" }}
                formatter={(value: any) => [`₹${parseInt(value).toLocaleString("en-IN")}`, "Revenue"]}
              />
              <Bar dataKey="value" fill="#ffffff" radius={[4, 4, 0, 0]}>
                {tierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Guest RSVP Distribution Donut Chart */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-6">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">
          Guest RSVP Status Distribution
        </h3>
        <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-between">
          <div className="h-full w-full sm:w-2/3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={guestData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {guestData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GUEST_COLORS[index % GUEST_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                  formatter={(value: any) => [value, "Guests"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full sm:w-1/3 space-y-2 mt-4 sm:mt-0 px-4">
            {guestData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: GUEST_COLORS[index % GUEST_COLORS.length] }}
                  />
                  <span className="text-zinc-400 capitalize">{entry.name}</span>
                </div>
                <span className="font-semibold text-zinc-200">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
