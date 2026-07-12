"use client";

import { useEffect, useState } from "react";

interface MyAsset {
  id: string;
  name: string;
  assetId: string;
  category: { name: string; code: string } | null;
  condition: string;
  status: string;
  healthScore: number | null;
  allocatedAt: string | null;
  returnDate: string | null;
}

interface DashboardData {
  assets: MyAsset[];
  totalAssets: number;
  upcomingReturns: number;
  maintenanceRequests: number;
  pendingTransfers: number;
}

function HealthRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : score >= 40 ? "#F97316" : "#EF4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F5F9" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const colors: Record<string, string> = {
    NEW: "bg-blue-50 text-blue-700",
    GOOD: "bg-green-50 text-green-700",
    FAIR: "bg-yellow-50 text-yellow-700",
    POOR: "bg-orange-50 text-orange-700",
    DAMAGED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[condition] || "bg-gray-100 text-gray-600"}`}>
      {condition}
    </span>
  );
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EmployeeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [meRes, assetsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/assets?assignedToMe=true&limit=50"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.success) setUser(meData.user);
      }

      let assets: MyAsset[] = [];
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        assets = assetsData.assets || [];
      }

      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      setData({
        assets,
        totalAssets: assets.length,
        upcomingReturns: assets.filter((a) => a.returnDate && new Date(a.returnDate).getTime() - now < thirtyDays && new Date(a.returnDate).getTime() > now).length,
        maintenanceRequests: assets.filter((a) => a.status === "MAINTENANCE").length,
        pendingTransfers: 0,
      });
    } catch {
      setData({ assets: [], totalAssets: 0, upcomingReturns: 0, maintenanceRequests: 0, pendingTransfers: 0 });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
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
            <h1 className="text-[22px] font-bold text-gray-900">My Dashboard</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      </header>

      <div className="px-8 py-7 flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h2 className="text-[26px] font-bold text-gray-900">{greeting}, {user?.firstName || "Employee"}</h2>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s a quick overview of your assigned assets and pending actions.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "My Assets", value: data?.totalAssets || 0, color: "text-emerald-600", bg: "bg-emerald-50", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
            { label: "Upcoming Returns", value: data?.upcomingReturns || 0, color: "text-orange-600", bg: "bg-orange-50", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2" },
            { label: "In Maintenance", value: data?.maintenanceRequests || 0, color: "text-yellow-600", bg: "bg-yellow-50", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
            { label: "Pending Transfers", value: data?.pendingTransfers || 0, color: "text-blue-600", bg: "bg-blue-50", icon: "M17 1l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={kpi.icon} />
                </svg>
              </div>
              <div className="text-[28px] font-extrabold text-gray-900 leading-none">{kpi.value}</div>
              <div className="text-xs font-medium text-gray-500 mt-1.5">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* My Assets */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-0 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">My Assets</h3>
              <p className="text-xs text-gray-500 mt-0.5">Assets currently assigned to you</p>
            </div>
          </div>
          <div className="px-6 py-5">
            {!data?.assets.length ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">No assets assigned yet</p>
                <p className="text-xs text-gray-400 mt-1">Assets allocated to you will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.assets.map((asset) => {
                  const returnDays = daysUntil(asset.returnDate);
                  return (
                    <div key={asset.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{asset.name}</h4>
                          <p className="text-[11px] text-gray-500 font-mono mt-0.5">{asset.assetId}</p>
                        </div>
                        {asset.healthScore !== null && <HealthRing score={asset.healthScore} size={42} />}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {asset.category && (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-gray-600">{asset.category.name}</span>
                        )}
                        <ConditionBadge condition={asset.condition} />
                      </div>
                      {returnDays !== null && (
                        <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium ${returnDays <= 7 ? "text-red-600" : returnDays <= 30 ? "text-orange-600" : "text-gray-500"}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          {returnDays <= 0 ? "Overdue" : `Return in ${returnDays} days`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Common operations</p>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Report Issue", desc: "Report a problem with an asset", bg: "bg-red-50", color: "text-red-700" },
              { label: "Request Asset", desc: "Request a new asset allocation", bg: "bg-blue-50", color: "text-blue-700" },
              { label: "Book Resource", desc: "Reserve a shared resource", bg: "bg-purple-50", color: "text-purple-700" },
              { label: "My Profile", desc: "View and update your info", bg: "bg-emerald-50", color: "text-emerald-700" },
            ].map((action) => (
              <button
                key={action.label}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border border-gray-100 hover:shadow-md hover:border-transparent transition-all text-center ${action.bg}`}
              >
                <span className={`text-sm font-semibold ${action.color}`}>{action.label}</span>
                <span className="text-[11px] text-gray-500">{action.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
