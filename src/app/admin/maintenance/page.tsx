"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface MaintenanceRecord {
  id: string;
  type: string;
  priority: string;
  status: string;
  description: string;
  cost: number | null;
  createdAt: string;
  scheduledDate: string | null;
  completedDate: string | null;
  vendor: string | null;
  asset: { id: string; assetId: string; name: string; status: string };
  raisedBy: { id: string; firstName: string; lastName: string };
}

interface MaintenanceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-50 text-blue-700",
    HIGH: "bg-orange-50 text-orange-700",
    CRITICAL: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${colors[priority] || "bg-gray-100 text-gray-600"}`}>
      {priority}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/maintenance?limit=100");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setStats(data.stats || null);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  const filteredRecords = filter === "ALL" ? records : records.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">Maintenance Overview</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Track and manage all maintenance requests</p>
          </div>
        </div>
      </header>

      <div className="px-8 py-7 flex flex-col gap-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Requests", value: stats.total, color: "text-gray-900", bg: "bg-gray-50" },
              { label: "Pending", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "In Progress", value: stats.inProgress, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Completed", value: stats.completed, color: "text-green-600", bg: "bg-green-50" },
              { label: "Cancelled", value: stats.cancelled, color: "text-gray-500", bg: "bg-gray-50" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className={`text-[28px] font-extrabold ${s.color} leading-none`}>{s.value}</div>
                <div className="text-xs font-medium text-gray-500 mt-1.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Row */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Status Distribution</h3>
              <div className="h-[220px] flex items-center justify-center">
                <div className="w-[200px] h-[200px]">
                  <Doughnut
                    data={{
                      labels: ["Pending", "In Progress", "Completed", "Cancelled"],
                      datasets: [{
                        data: [stats.pending, stats.inProgress, stats.completed, stats.cancelled],
                        backgroundColor: ["#F59E0B", "#3B82F6", "#22C55E", "#94A3B8"],
                        borderColor: "#fff",
                        borderWidth: 3,
                        borderRadius: 4,
                      }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: true, cutout: "65%", plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, padding: 12 } } } }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Priority Breakdown</h3>
              <div className="h-[220px]">
                <Bar
                  data={{
                    labels: ["Low", "Medium", "High", "Critical"],
                    datasets: [{
                      label: "Requests",
                      data: [
                        records.filter((r) => r.priority === "LOW").length,
                        records.filter((r) => r.priority === "MEDIUM").length,
                        records.filter((r) => r.priority === "HIGH").length,
                        records.filter((r) => r.priority === "CRITICAL").length,
                      ],
                      backgroundColor: ["#94A3B8", "#3B82F6", "#F97316", "#EF4444"],
                      borderRadius: 6,
                      borderSkipped: false,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { grid: { color: "rgba(148,163,184,0.1)" }, ticks: { font: { size: 11 } } },
                      x: { grid: { display: false }, ticks: { font: { size: 11, weight: "bold" as const } } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-blue-600 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Records Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-medium text-gray-600">No maintenance records found</p>
              <p className="text-xs text-gray-400 mt-1">Maintenance requests will appear here when created</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Raised By</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{rec.asset.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{rec.asset.assetId}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{rec.type}</td>
                      <td className="px-6 py-4"><PriorityBadge priority={rec.priority} /></td>
                      <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                      <td className="px-6 py-4 text-xs text-gray-600">{rec.raisedBy.firstName} {rec.raisedBy.lastName}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{rec.cost != null ? `$${rec.cost.toLocaleString()}` : "—"}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{timeAgo(rec.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
