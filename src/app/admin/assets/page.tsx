"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Asset {
  id: string;
  assetId: string;
  assetTag: string;
  name: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  condition: string;
  status: string;
  location: string | null;
  purchaseCost: number | null;
  healthScore: number | null;
  riskScore: string | null;
  category: { id: string; name: string; code: string };
  department: { id: string; name: string } | null;
  createdAt: string;
}

interface Category { id: string; name: string; code: string; }
interface Department { id: string; name: string; }

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-50 text-green-700",
  ALLOCATED: "bg-blue-50 text-blue-700",
  MAINTENANCE: "bg-yellow-50 text-yellow-700",
  RESERVED: "bg-indigo-50 text-indigo-700",
  DAMAGED: "bg-red-50 text-red-700",
  LOST: "bg-gray-100 text-gray-700",
  DISPOSED: "bg-gray-100 text-gray-500",
  RETIRED: "bg-orange-50 text-orange-700",
  ARCHIVED: "bg-gray-50 text-gray-400",
};

const CONDITION_COLORS: Record<string, string> = {
  EXCELLENT: "text-green-600",
  GOOD: "text-blue-600",
  FAIR: "text-yellow-600",
  POOR: "text-orange-600",
  DAMAGED: "text-red-600",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

function HealthBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 70 ? "bg-green-500" : s >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${s}%` }} />
      </div>
      <span className="text-xs text-gray-600">{s}</span>
    </div>
  );
}

export default function AssetDirectoryPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const limit = 25;

  useEffect(() => {
    Promise.all([fetchCategories(), fetchDepartments()]);
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [search, statusFilter, categoryFilter, departmentFilter, conditionFilter, sortBy, sortOrder, page]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {}
  }

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch {}
  }

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (departmentFilter) params.set("departmentId", departmentFilter);
      if (conditionFilter) params.set("condition", conditionFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      showToast("Failed to fetch assets", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, departmentFilter, conditionFilter, sortBy, sortOrder, page]);

  function showToast(message: string, type: string = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.type === "error" ? "✖" : "✔"} {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Asset Directory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track all organizational assets</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/admin/assets/register")}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              + Register Asset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search assets by name, ID, serial, brand..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              {["AVAILABLE", "ALLOCATED", "MAINTENANCE", "RESERVED", "DAMAGED", "LOST", "RETIRED"].map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={conditionFilter}
              onChange={(e) => { setConditionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Conditions</option>
              {["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"].map((c) => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {total} asset{total !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    { key: "assetId", label: "Asset ID" },
                    { key: "name", label: "Name" },
                    { key: "", label: "Category" },
                    { key: "", label: "Department" },
                    { key: "condition", label: "Condition" },
                    { key: "status", label: "Status" },
                    { key: "healthScore", label: "Health" },
                    { key: "", label: "Risk" },
                    { key: "purchaseCost", label: "Cost" },
                    { key: "", label: "Actions" },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase ${col.key ? "cursor-pointer hover:text-gray-700" : ""}`}
                      onClick={() => col.key && handleSort(col.key)}
                    >
                      {col.label}
                      {col.key && sortBy === col.key && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <p className="font-medium text-gray-900">No assets found</p>
                        <p className="text-sm">Register your first asset to get started.</p>
                      </div>
                      <button
                        onClick={() => router.push("/admin/assets/register")}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                      >
                        Register Asset
                      </button>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/assets/${asset.id}`)}>
                      <td className="px-4 py-3 font-mono text-xs text-purple-600 font-medium">{asset.assetId}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        {asset.brand && <div className="text-xs text-gray-500">{asset.brand} {asset.model || ""}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{asset.category.name}</td>
                      <td className="px-4 py-3 text-gray-600">{asset.department?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${CONDITION_COLORS[asset.condition] || ""}`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status] || "bg-gray-100"}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <HealthBar score={asset.healthScore} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${RISK_COLORS[asset.riskScore || "LOW"]}`}>
                          {asset.riskScore || "LOW"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {asset.purchaseCost != null ? `$${asset.purchaseCost.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/admin/assets/${asset.id}`)}
                          className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
