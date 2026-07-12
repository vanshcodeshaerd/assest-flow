"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface DashboardStats {
  totalEmployees: number;
  pendingApprovals: number;
  totalDepartments: number;
  totalCategories: number;
  totalManagers: number;
  totalHR: number;
  activeEmployees: number;
  inactiveEmployees: number;
  suspendedEmployees: number;
  rejectedEmployees: number;
  totalAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  maintenanceAssets: number;
  damagedAssets: number;
  lostAssets: number;
  retiredAssets: number;
}

interface RecentEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  departmentRef: { name: string } | null;
}

interface RecentActivity {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  user: { firstName: string; lastName: string };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    PENDING: "bg-yellow-50 text-yellow-700",
    REJECTED: "bg-red-50 text-red-700",
    SUSPENDED: "bg-orange-50 text-orange-700",
    INACTIVE: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
    MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
    HR: "bg-pink-50 text-pink-700 border-pink-200",
    EMPLOYEE: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[role] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {role}
    </span>
  );
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data.stats);
      setRecentEmployees(data.recentlyJoined || []);
      setRecentActivities(data.recentActivities || []);
    } catch {
      console.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">Dashboard</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/assets/register")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 shadow-sm transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Quick Add
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-7 flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h2 className="text-[26px] font-bold text-gray-900">{greeting}, Admin</h2>
          <p className="text-gray-500 text-sm mt-1">Real-time overview of your company&apos;s assets and resources.</p>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Assets Available", value: stats.availableAssets, color: "text-green-600", bg: "bg-green-50", icon: "check" },
              { label: "Assets Allocated", value: stats.allocatedAssets, color: "text-blue-600", bg: "bg-blue-50", icon: "share" },
              { label: "In Maintenance", value: stats.maintenanceAssets, color: "text-yellow-600", bg: "bg-yellow-50", icon: "tool" },
              { label: "Total Employees", value: stats.totalEmployees, color: "text-purple-600", bg: "bg-purple-50", icon: "users" },
              { label: "Pending Approvals", value: stats.pendingApprovals, color: "text-orange-600", bg: "bg-orange-50", icon: "clock" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all cursor-default">
                <div className={`w-10 h-10 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
                  <KpiIcon name={kpi.icon} />
                </div>
                <div className="text-[28px] font-extrabold text-gray-900 leading-none tracking-tight">{kpi.value}</div>
                <div className="text-xs font-medium text-gray-500 mt-1.5">{kpi.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Row: Lifecycle Chart + Asset Stats */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-0">
                <h3 className="text-base font-bold text-gray-900">Asset Lifecycle Distribution</h3>
                <p className="text-xs text-gray-500 mt-0.5">Current state of all {stats.totalAssets} assets</p>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="w-[240px] h-[240px] mx-auto shrink-0">
                    <Doughnut
                      data={{
                        labels: ["Available", "Allocated", "Maintenance", "Damaged", "Lost", "Retired"],
                        datasets: [{
                          data: [stats.availableAssets, stats.allocatedAssets, stats.maintenanceAssets, stats.damagedAssets, stats.lostAssets, stats.retiredAssets],
                          backgroundColor: ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#94A3B8", "#6B7280"],
                          borderColor: "#fff",
                          borderWidth: 3,
                          borderRadius: 4,
                          spacing: 2,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: "72%",
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: "#1E293B",
                            padding: 10,
                            cornerRadius: 8,
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 min-w-[200px]">
                    {[
                      { label: "Available", value: stats.availableAssets, color: "#22C55E" },
                      { label: "Allocated", value: stats.allocatedAssets, color: "#3B82F6" },
                      { label: "Maintenance", value: stats.maintenanceAssets, color: "#F59E0B" },
                      { label: "Damaged", value: stats.damagedAssets, color: "#EF4444" },
                      { label: "Lost", value: stats.lostAssets, color: "#94A3B8" },
                      { label: "Retired", value: stats.retiredAssets, color: "#6B7280" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 py-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-gray-600">{item.label}</span>
                        <span className="text-xs font-bold text-gray-900 ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-0">
                <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
                <p className="text-xs text-gray-500 mt-0.5">Common operations</p>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Register Asset", path: "/admin/assets/register", bg: "bg-blue-50", color: "text-blue-700" },
                  { label: "View Assets", path: "/admin/assets", bg: "bg-purple-50", color: "text-purple-700" },
                  { label: "Organization", path: "/admin/organization", bg: "bg-green-50", color: "text-green-700" },
                  { label: "Employees", path: "/admin/organization", bg: "bg-pink-50", color: "text-pink-700" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.path)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:shadow-md hover:border-transparent transition-all text-center ${action.bg}`}
                  >
                    <span className={`text-xs font-semibold ${action.color}`}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Row: Employee Status + Department Distribution */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-0">
                <h3 className="text-base font-bold text-gray-900">Employee Status Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Current workforce distribution</p>
              </div>
              <div className="px-6 py-5">
                <div className="h-[200px]">
                  <Bar
                    data={{
                      labels: ["Active", "Pending", "Suspended", "Inactive", "Rejected"],
                      datasets: [{
                        label: "Employees",
                        data: [stats.activeEmployees, stats.pendingApprovals, stats.suspendedEmployees, stats.inactiveEmployees, stats.rejectedEmployees],
                        backgroundColor: ["#22C55E", "#F59E0B", "#F97316", "#94A3B8", "#EF4444"],
                        borderRadius: 6,
                        borderSkipped: false,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1E293B", padding: 10, cornerRadius: 8 } },
                      scales: {
                        y: { grid: { color: "rgba(148,163,184,0.1)" }, ticks: { font: { size: 11 }, color: "#94A3B8" } },
                        x: { grid: { display: false }, ticks: { font: { size: 11, weight: "bold" as const }, color: "#475569" } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-0">
                <h3 className="text-base font-bold text-gray-900">Organization Overview</h3>
                <p className="text-xs text-gray-500 mt-0.5">Key organizational metrics</p>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                {[
                  { label: "Departments", value: stats.totalDepartments, color: "bg-purple-500" },
                  { label: "Categories", value: stats.totalCategories, color: "bg-green-500" },
                  { label: "Managers", value: stats.totalManagers, color: "bg-indigo-500" },
                  { label: "HR Staff", value: stats.totalHR, color: "bg-pink-500" },
                  { label: "Total Assets", value: stats.totalAssets, color: "bg-blue-500" },
                  { label: "Active Staff", value: stats.activeEmployees, color: "bg-emerald-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                    <div className="flex-1">
                      <div className="text-[11px] text-gray-500">{item.label}</div>
                      <div className="text-lg font-bold text-gray-900">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Row: Recent Activity + Recently Joined */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
                <p className="text-xs text-gray-500 mt-0.5">Latest operations and movements</p>
              </div>
            </div>
            <div className="px-6 py-5">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
              ) : (
                <div className="space-y-0 relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-100" />
                  {recentActivities.slice(0, 8).map((act) => (
                    <div key={act.id} className="relative flex gap-3 py-3">
                      <div className="absolute left-[-18px] top-[18px] w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow-sm z-10" />
                      <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <div className="text-[13px] text-gray-900">
                          <span className="font-semibold">{act.user.firstName} {act.user.lastName}</span>{" "}
                          {formatAction(act.action)}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 flex gap-3">
                          <span>{act.entity} {act.entityId ? `#${act.entityId.slice(0, 8)}` : ""}</span>
                          <span>{timeAgo(act.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recently Joined</h3>
                <p className="text-xs text-gray-500 mt-0.5">Last 30 days</p>
              </div>
              <button onClick={() => router.push("/admin/organization")} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View All</button>
            </div>
            <div className="px-6 py-5">
              {recentEmployees.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No recent joins</p>
              ) : (
                <div className="space-y-3">
                  {recentEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-gray-500">{emp.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RoleBadge role={emp.role} />
                        <StatusBadge status={emp.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiIcon({ name }: { name: string }) {
  const p = { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "check": return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    case "share": return <svg {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
    case "tool": return <svg {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
    case "users": return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="10" /></svg>;
  }
}
