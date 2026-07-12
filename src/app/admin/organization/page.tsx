"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, ChevronLeft, ChevronRight, X, Building2, Users, Tag,
  Check, XCircle, Shield, MoreHorizontal, Eye, Edit2, Archive, RotateCcw,
  ArrowUpDown, Filter, AlertCircle, Loader2, ChevronDown
} from "lucide-react";

type Tab = "DEPARTMENTS" | "EMPLOYEES" | "CATEGORIES";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  headId: string | null;
  status: string;
  createdAt: string;
  departmentHead: { id: string; firstName: string; lastName: string; email: string } | null;
  _count: { users: number; assets: number };
}

interface Employee {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  employeeId: string | null;
  phone: string | null;
  role: string;
  status: string;
  isActive: boolean;
  departmentId: string | null;
  createdAt: string;
  joinedAt: string | null;
  departmentRef: { id: string; name: string; code: string } | null;
}

interface Category {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  createdAt: string;
  _count: { assets: number };
}

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    INACTIVE: "bg-zinc-100 text-zinc-600 border-zinc-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    SUSPENDED: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.INACTIVE}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
    HR: "bg-pink-50 text-pink-700 border-pink-200",
    MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
    EMPLOYEE: "bg-zinc-100 text-zinc-600 border-zinc-200",
    DEPT_HEAD: "bg-orange-50 text-orange-700 border-orange-200",
    ASSET_MANAGER: "bg-teal-50 text-teal-700 border-teal-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[role] || colors.EMPLOYEE}`}>
      {role}
    </span>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-2 ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100"><X className="w-5 h-5 text-zinc-400" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationControls({ pagination, onPageChange, onLimitChange }: {
  pagination: Pagination; onPageChange: (p: number) => void; onLimitChange: (l: number) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span>Rows per page:</span>
        <select value={pagination.limit} onChange={(e) => onLimitChange(Number(e.target.value))} className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="ml-4">{((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 text-sm font-medium text-zinc-700">{pagination.page} / {pagination.totalPages || 1}</span>
        <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-zinc-400" />
      </div>
      <h3 className="text-sm font-medium text-zinc-700">{title}</h3>
      <p className="text-xs text-zinc-400 mt-1 max-w-xs">{description}</p>
    </div>
  );
}

function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-zinc-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ─── Main Component ───

export default function OrganizationSetup() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("DEPARTMENTS");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Department state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptPagination, setDeptPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [deptSearch, setDeptSearch] = useState("");
  const [deptStatusFilter, setDeptStatusFilter] = useState("");
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "", headId: "", status: "ACTIVE" });
  const [deptSaving, setDeptSaving] = useState(false);

  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empPagination, setEmpPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [empSearch, setEmpSearch] = useState("");
  const [empRoleFilter, setEmpRoleFilter] = useState("");
  const [empStatusFilter, setEmpStatusFilter] = useState("");
  const [empDeptFilter, setEmpDeptFilter] = useState("");
  const [empSortBy, setEmpSortBy] = useState("createdAt");
  const [empSortOrder, setEmpSortOrder] = useState<"asc" | "desc">("desc");
  const [empLoading, setEmpLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoteModal, setPromoteModal] = useState<{ id: string; name: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState("");
  const [assignDeptModal, setAssignDeptModal] = useState<{ id: string; name: string } | null>(null);
  const [assignDeptId, setAssignDeptId] = useState("");

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catPagination, setCatPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [catSearch, setCatSearch] = useState("");
  const [catStatusFilter, setCatStatusFilter] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", code: "", description: "", status: "ACTIVE" });
  const [catSaving, setCatSaving] = useState(false);

  // ─── Fetch Functions ───

  const fetchDepartments = useCallback(async () => {
    setDeptLoading(true);
    const params = new URLSearchParams({
      page: String(deptPagination.page),
      limit: String(deptPagination.limit),
      ...(deptSearch && { search: deptSearch }),
      ...(deptStatusFilter && { status: deptStatusFilter }),
    });
    const data = await api(`/api/departments?${params}`);
    if (data.success) {
      setDepartments(data.departments);
      setDeptPagination(data.pagination);
    }
    setDeptLoading(false);
  }, [deptPagination.page, deptPagination.limit, deptSearch, deptStatusFilter]);

  const fetchEmployees = useCallback(async () => {
    setEmpLoading(true);
    const params = new URLSearchParams({
      page: String(empPagination.page),
      limit: String(empPagination.limit),
      sortBy: empSortBy,
      sortOrder: empSortOrder,
      ...(empSearch && { search: empSearch }),
      ...(empRoleFilter && { role: empRoleFilter }),
      ...(empStatusFilter && { status: empStatusFilter }),
      ...(empDeptFilter && { department: empDeptFilter }),
    });
    const data = await api(`/api/users?${params}`);
    if (data.success) {
      setEmployees(data.employees);
      setEmpPagination(data.pagination);
    }
    setEmpLoading(false);
  }, [empPagination.page, empPagination.limit, empSearch, empRoleFilter, empStatusFilter, empDeptFilter, empSortBy, empSortOrder]);

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    const params = new URLSearchParams({
      page: String(catPagination.page),
      limit: String(catPagination.limit),
      ...(catSearch && { search: catSearch }),
      ...(catStatusFilter && { status: catStatusFilter }),
    });
    const data = await api(`/api/categories?${params}`);
    if (data.success) {
      setCategories(data.categories);
      setCatPagination(data.pagination);
    }
    setCatLoading(false);
  }, [catPagination.page, catPagination.limit, catSearch, catStatusFilter]);

  useEffect(() => { if (activeTab === "DEPARTMENTS") fetchDepartments(); }, [activeTab, fetchDepartments]);
  useEffect(() => { if (activeTab === "EMPLOYEES") fetchEmployees(); }, [activeTab, fetchEmployees]);
  useEffect(() => { if (activeTab === "CATEGORIES") fetchCategories(); }, [activeTab, fetchCategories]);

  // ─── Department Actions ───

  const openDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code, description: dept.description || "", headId: dept.headId || "", status: dept.status });
    } else {
      setEditingDept(null);
      setDeptForm({ name: "", code: "", description: "", headId: "", status: "ACTIVE" });
    }
    setDeptModalOpen(true);
  };

  const saveDepartment = async () => {
    setDeptSaving(true);
    const url = editingDept ? `/api/departments/${editingDept.id}` : "/api/departments";
    const method = editingDept ? "PATCH" : "POST";
    const body: any = { name: deptForm.name, code: deptForm.code, description: deptForm.description || undefined, status: deptForm.status };
    if (deptForm.headId) body.headId = deptForm.headId;

    const data = await api(url, { method, body: JSON.stringify(body) });
    setDeptSaving(false);

    if (data.success !== false) {
      setToast({ message: editingDept ? "Department updated" : "Department created", type: "success" });
      setDeptModalOpen(false);
      fetchDepartments();
    } else {
      setToast({ message: data.message || "Failed to save department", type: "error" });
    }
  };

  const archiveDepartment = async (id: string) => {
    setActionLoading(true);
    const data = await api(`/api/departments/${id}`, { method: "DELETE" });
    setActionLoading(false);
    setConfirmAction(null);
    if (data.success !== false) {
      setToast({ message: "Department archived", type: "success" });
      fetchDepartments();
    } else {
      setToast({ message: data.message || "Failed to archive", type: "error" });
    }
  };

  // ─── Employee Actions ───

  const viewProfile = async (id: string) => {
    const data = await api(`/api/users/${id}`);
    if (data.success) {
      setSelectedEmployee(data.employee);
      setProfileOpen(true);
    }
  };

  const approveEmployee = async (id: string) => {
    setActionLoading(true);
    const data = await api(`/api/users/${id}/approve`, { method: "PATCH" });
    setActionLoading(false);
    setConfirmAction(null);
    if (data.success !== false) {
      setToast({ message: "Employee approved", type: "success" });
      fetchEmployees();
    } else {
      setToast({ message: data.message || "Failed to approve", type: "error" });
    }
  };

  const rejectEmployee = async (id: string) => {
    setActionLoading(true);
    const data = await api(`/api/users/${id}/reject`, { method: "PATCH", body: JSON.stringify({}) });
    setActionLoading(false);
    setConfirmAction(null);
    if (data.success !== false) {
      setToast({ message: "Employee rejected", type: "success" });
      fetchEmployees();
    } else {
      setToast({ message: data.message || "Failed to reject", type: "error" });
    }
  };

  const changeStatus = async (id: string, status: string) => {
    setActionLoading(true);
    const data = await api(`/api/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    setActionLoading(false);
    setConfirmAction(null);
    if (data.success !== false) {
      setToast({ message: `Status changed to ${status}`, type: "success" });
      fetchEmployees();
    } else {
      setToast({ message: data.message || "Failed to change status", type: "error" });
    }
  };

  const promoteEmployee = async () => {
    if (!promoteModal || !newRole) return;
    setActionLoading(true);
    const data = await api(`/api/users/${promoteModal.id}/promote`, { method: "PATCH", body: JSON.stringify({ newRole }) });
    setActionLoading(false);
    setPromoteModal(null);
    setNewRole("");
    if (data.success !== false) {
      setToast({ message: data.message || "Role changed", type: "success" });
      fetchEmployees();
    } else {
      setToast({ message: data.message || "Failed to change role", type: "error" });
    }
  };

  const assignDepartment = async () => {
    if (!assignDeptModal) return;
    setActionLoading(true);
    const data = await api(`/api/users/${assignDeptModal.id}`, {
      method: "PATCH",
      body: JSON.stringify({ departmentId: assignDeptId || null }),
    });
    setActionLoading(false);
    setAssignDeptModal(null);
    setAssignDeptId("");
    if (data.success !== false) {
      setToast({ message: "Department assigned", type: "success" });
      fetchEmployees();
    } else {
      setToast({ message: data.message || "Failed to assign department", type: "error" });
    }
  };

  // ─── Category Actions ───

  const openCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, code: cat.code, description: cat.description || "", status: cat.status });
    } else {
      setEditingCat(null);
      setCatForm({ name: "", code: "", description: "", status: "ACTIVE" });
    }
    setCatModalOpen(true);
  };

  const saveCategory = async () => {
    setCatSaving(true);
    const url = editingCat ? `/api/categories/${editingCat.id}` : "/api/categories";
    const method = editingCat ? "PATCH" : "POST";
    const body = { name: catForm.name, code: catForm.code, description: catForm.description || undefined, status: catForm.status };

    const data = await api(url, { method, body: JSON.stringify(body) });
    setCatSaving(false);

    if (data.success !== false) {
      setToast({ message: editingCat ? "Category updated" : "Category created", type: "success" });
      setCatModalOpen(false);
      fetchCategories();
    } else {
      setToast({ message: data.message || "Failed to save category", type: "error" });
    }
  };

  const archiveCategory = async (id: string) => {
    setActionLoading(true);
    const data = await api(`/api/categories/${id}`, { method: "DELETE" });
    setActionLoading(false);
    setConfirmAction(null);
    if (data.success !== false) {
      setToast({ message: "Category archived", type: "success" });
      fetchCategories();
    } else {
      setToast({ message: data.message || "Failed to archive", type: "error" });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    switch (type) {
      case "archive-dept": archiveDepartment(id); break;
      case "archive-cat": archiveCategory(id); break;
      case "approve": approveEmployee(id); break;
      case "reject": rejectEmployee(id); break;
      case "suspend": changeStatus(id, "SUSPENDED"); break;
      case "deactivate": changeStatus(id, "INACTIVE"); break;
      case "activate": changeStatus(id, "ACTIVE"); break;
    }
  };

  const empDisplayName = (e: Employee) => {
    if (e.firstName || e.lastName) return `${e.firstName || ""} ${e.lastName || ""}`.trim();
    return e.name || e.email;
  };

  const toggleSort = (field: string) => {
    if (empSortBy === field) {
      setEmpSortOrder(empSortOrder === "asc" ? "desc" : "asc");
    } else {
      setEmpSortBy(field);
      setEmpSortOrder("asc");
    }
  };

  const tabConfig = [
    { key: "DEPARTMENTS" as Tab, label: "Departments", icon: Building2, count: deptPagination.total },
    { key: "EMPLOYEES" as Tab, label: "Employees", icon: Users, count: empPagination.total },
    { key: "CATEGORIES" as Tab, label: "Categories", icon: Tag, count: catPagination.total },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={`Confirm ${confirmAction?.type.replace("-", " ")}`}
        message={`Are you sure you want to ${confirmAction?.type.replace("-", " ")} "${confirmAction?.name}"?`}
        loading={actionLoading}
      />

      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Organization Setup</h1>
              <p className="text-sm text-zinc-500 mt-1">Manage departments, employees, and asset categories</p>
            </div>
            <button onClick={() => router.push("/admin/dashboard")} className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-200/50 p-1 rounded-xl w-fit mb-6">
          {tabConfig.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key ? "bg-white shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && <span className="ml-1 text-xs bg-zinc-200/80 px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          ))}
        </div>

        {/* ──── DEPARTMENTS TAB ──── */}
        {activeTab === "DEPARTMENTS" && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text" placeholder="Search departments..." value={deptSearch}
                    onChange={(e) => { setDeptSearch(e.target.value); setDeptPagination(p => ({ ...p, page: 1 })); }}
                    className="pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                  />
                </div>
                <select value={deptStatusFilter} onChange={(e) => { setDeptStatusFilter(e.target.value); setDeptPagination(p => ({ ...p, page: 1 })); }}
                  className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <button onClick={() => openDeptModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Department
              </button>
            </div>

            <div className="p-5">
              {deptLoading ? <Skeleton /> : departments.length === 0 ? (
                <EmptyState icon={Building2} title="No departments" description="Create your first department to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-zinc-500 border-b border-zinc-100">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Code</th>
                        <th className="px-4 py-3 font-medium">Head</th>
                        <th className="px-4 py-3 font-medium">Employees</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {departments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-zinc-900">{dept.name}</p>
                              {dept.description && <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">{dept.description}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{dept.code}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">
                            {dept.departmentHead ? `${dept.departmentHead.firstName || ""} ${dept.departmentHead.lastName || ""}`.trim() || dept.departmentHead.email : "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-500">{dept._count.users}</td>
                          <td className="px-4 py-3"><StatusBadge status={dept.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => openDeptModal(dept)} className="p-1.5 rounded-lg hover:bg-zinc-100" title="Edit">
                                <Edit2 className="w-4 h-4 text-zinc-400" />
                              </button>
                              <button onClick={() => setConfirmAction({ type: "archive-dept", id: dept.id, name: dept.name })} className="p-1.5 rounded-lg hover:bg-zinc-100" title="Archive">
                                <Archive className="w-4 h-4 text-zinc-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {deptPagination.total > 0 && (
                <PaginationControls
                  pagination={deptPagination}
                  onPageChange={(p) => setDeptPagination(prev => ({ ...prev, page: p }))}
                  onLimitChange={(l) => setDeptPagination(prev => ({ ...prev, limit: l, page: 1 }))}
                />
              )}
            </div>
          </div>
        )}

        {/* ──── EMPLOYEES TAB ──── */}
        {activeTab === "EMPLOYEES" && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input type="text" placeholder="Search employees..." value={empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); setEmpPagination(p => ({ ...p, page: 1 })); }}
                    className="pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                  />
                </div>
                <select value={empStatusFilter} onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpPagination(p => ({ ...p, page: 1 })); }}
                  className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <select value={empRoleFilter} onChange={(e) => { setEmpRoleFilter(e.target.value); setEmpPagination(p => ({ ...p, page: 1 })); }}
                  className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Roles</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <select value={empDeptFilter} onChange={(e) => { setEmpDeptFilter(e.target.value); setEmpPagination(p => ({ ...p, page: 1 })); }}
                  className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="p-5">
              {empLoading ? <Skeleton /> : employees.length === 0 ? (
                <EmptyState icon={Users} title="No employees found" description="No employees match the current filters." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-zinc-500 border-b border-zinc-100">
                      <tr>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700" onClick={() => toggleSort("firstName")}>
                          <span className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-700" onClick={() => toggleSort("employeeId")}>
                          <span className="flex items-center gap-1">Employee ID <ArrowUpDown className="w-3 h-3" /></span>
                        </th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Department</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{empDisplayName(emp)}</td>
                          <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{emp.employeeId || "—"}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">{emp.email}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">{emp.departmentRef?.name || "—"}</td>
                          <td className="px-4 py-3"><RoleBadge role={emp.role} /></td>
                          <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => viewProfile(emp.id)} className="p-1.5 rounded-lg hover:bg-zinc-100" title="View Profile">
                                <Eye className="w-4 h-4 text-zinc-400" />
                              </button>
                              {emp.status === "PENDING" && (
                                <>
                                  <button onClick={() => setConfirmAction({ type: "approve", id: emp.id, name: empDisplayName(emp) })} className="p-1.5 rounded-lg hover:bg-emerald-50" title="Approve">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  </button>
                                  <button onClick={() => setConfirmAction({ type: "reject", id: emp.id, name: empDisplayName(emp) })} className="p-1.5 rounded-lg hover:bg-red-50" title="Reject">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  </button>
                                </>
                              )}
                              {emp.status === "ACTIVE" && emp.role !== "ADMIN" && (
                                <>
                                  <button onClick={() => { setPromoteModal({ id: emp.id, name: empDisplayName(emp), currentRole: emp.role }); setNewRole(""); }} className="p-1.5 rounded-lg hover:bg-blue-50" title="Change Role">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                  </button>
                                  <button onClick={() => { setAssignDeptModal({ id: emp.id, name: empDisplayName(emp) }); setAssignDeptId(emp.departmentId || ""); }} className="p-1.5 rounded-lg hover:bg-zinc-100" title="Assign Department">
                                    <Building2 className="w-4 h-4 text-zinc-400" />
                                  </button>
                                </>
                              )}
                              {emp.status === "ACTIVE" && emp.role !== "ADMIN" && (
                                <button onClick={() => setConfirmAction({ type: "suspend", id: emp.id, name: empDisplayName(emp) })} className="p-1.5 rounded-lg hover:bg-orange-50" title="Suspend">
                                  <AlertCircle className="w-4 h-4 text-orange-500" />
                                </button>
                              )}
                              {emp.status === "SUSPENDED" && (
                                <button onClick={() => setConfirmAction({ type: "activate", id: emp.id, name: empDisplayName(emp) })} className="p-1.5 rounded-lg hover:bg-emerald-50" title="Reactivate">
                                  <RotateCcw className="w-4 h-4 text-emerald-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {empPagination.total > 0 && (
                <PaginationControls
                  pagination={empPagination}
                  onPageChange={(p) => setEmpPagination(prev => ({ ...prev, page: p }))}
                  onLimitChange={(l) => setEmpPagination(prev => ({ ...prev, limit: l, page: 1 }))}
                />
              )}
            </div>
          </div>
        )}

        {/* ──── CATEGORIES TAB ──── */}
        {activeTab === "CATEGORIES" && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <div className="p-5 border-b border-zinc-100 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input type="text" placeholder="Search categories..." value={catSearch}
                    onChange={(e) => { setCatSearch(e.target.value); setCatPagination(p => ({ ...p, page: 1 })); }}
                    className="pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                  />
                </div>
                <select value={catStatusFilter} onChange={(e) => { setCatStatusFilter(e.target.value); setCatPagination(p => ({ ...p, page: 1 })); }}
                  className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <button onClick={() => openCatModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="p-5">
              {catLoading ? <Skeleton /> : categories.length === 0 ? (
                <EmptyState icon={Tag} title="No categories" description="Create your first asset category to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-zinc-500 border-b border-zinc-100">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Code</th>
                        <th className="px-4 py-3 font-medium">Description</th>
                        <th className="px-4 py-3 font-medium">Assets</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{cat.name}</td>
                          <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{cat.code}</td>
                          <td className="px-4 py-3 text-zinc-400 text-xs truncate max-w-xs">{cat.description || "—"}</td>
                          <td className="px-4 py-3 text-zinc-500">{cat._count.assets}</td>
                          <td className="px-4 py-3"><StatusBadge status={cat.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => openCatModal(cat)} className="p-1.5 rounded-lg hover:bg-zinc-100" title="Edit">
                                <Edit2 className="w-4 h-4 text-zinc-400" />
                              </button>
                              <button onClick={() => setConfirmAction({ type: "archive-cat", id: cat.id, name: cat.name })} className="p-1.5 rounded-lg hover:bg-zinc-100" title="Archive">
                                <Archive className="w-4 h-4 text-zinc-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {catPagination.total > 0 && (
                <PaginationControls
                  pagination={catPagination}
                  onPageChange={(p) => setCatPagination(prev => ({ ...prev, page: p }))}
                  onLimitChange={(l) => setCatPagination(prev => ({ ...prev, limit: l, page: 1 }))}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ──── MODALS ──── */}

      {/* Department Modal */}
      <Modal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} title={editingDept ? "Edit Department" : "Create Department"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
            <input type="text" value={deptForm.name} onChange={(e) => setDeptForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Engineering" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Code *</label>
            <input type="text" value={deptForm.code} onChange={(e) => setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="e.g. ENG" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea value={deptForm.description} onChange={(e) => setDeptForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
            <select value={deptForm.status} onChange={(e) => setDeptForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setDeptModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancel</button>
            <button onClick={saveDepartment} disabled={deptSaving || !deptForm.name || !deptForm.code}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {deptSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingDept ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingCat ? "Edit Category" : "Create Category"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
            <input type="text" value={catForm.name} onChange={(e) => setCatForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Laptops" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Code *</label>
            <input type="text" value={catForm.code} onChange={(e) => setCatForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="e.g. LAP" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea value={catForm.description} onChange={(e) => setCatForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
            <select value={catForm.status} onChange={(e) => setCatForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setCatModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancel</button>
            <button onClick={saveCategory} disabled={catSaving || !catForm.name || !catForm.code}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {catSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCat ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Promote Modal */}
      <Modal open={!!promoteModal} onClose={() => setPromoteModal(null)} title="Change Role">
        {promoteModal && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Change role for <span className="font-medium">{promoteModal.name}</span>
              <br />Current role: <RoleBadge role={promoteModal.currentRole} />
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">New Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select role...</option>
                {["EMPLOYEE", "MANAGER", "HR", "ADMIN"].filter(r => r !== promoteModal.currentRole).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setPromoteModal(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancel</button>
              <button onClick={promoteEmployee} disabled={actionLoading || !newRole}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Change Role
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Department Modal */}
      <Modal open={!!assignDeptModal} onClose={() => setAssignDeptModal(null)} title="Assign Department">
        {assignDeptModal && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Assign department for <span className="font-medium">{assignDeptModal.name}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Department</label>
              <select value={assignDeptId} onChange={(e) => setAssignDeptId(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">No Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setAssignDeptModal(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancel</button>
              <button onClick={assignDepartment} disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Assign
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Employee Profile Drawer */}
      {profileOpen && selectedEmployee && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setProfileOpen(false)} />
          <div className="ml-auto relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold">Employee Profile</h3>
              <button onClick={() => setProfileOpen(false)} className="p-1 rounded-lg hover:bg-zinc-100"><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Name</span><span className="font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Email</span><span>{selectedEmployee.email}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Employee ID</span><span className="font-mono text-xs">{selectedEmployee.employeeId || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Phone</span><span>{selectedEmployee.phone || "—"}</span></div>
                </div>
              </div>
              {/* Employment */}
              <div>
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Employment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm items-center"><span className="text-zinc-500">Role</span><RoleBadge role={selectedEmployee.role} /></div>
                  <div className="flex justify-between text-sm items-center"><span className="text-zinc-500">Status</span><StatusBadge status={selectedEmployee.status} /></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Department</span><span>{selectedEmployee.departmentRef?.name || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Joined</span><span>{selectedEmployee.joinedAt ? new Date(selectedEmployee.joinedAt).toLocaleDateString() : "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Approved</span><span>{selectedEmployee.approvedAt ? new Date(selectedEmployee.approvedAt).toLocaleDateString() : "—"}</span></div>
                </div>
              </div>
              {/* Role History */}
              {selectedEmployee.roleHistory?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Role History</h4>
                  <div className="space-y-2">
                    {selectedEmployee.roleHistory.map((rh: any) => (
                      <div key={rh.id} className="text-sm border border-zinc-100 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <RoleBadge role={rh.oldRole} />
                          <span className="text-zinc-400">&rarr;</span>
                          <RoleBadge role={rh.newRole} />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{new Date(rh.changedAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Login History */}
              {selectedEmployee.loginHistory?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Recent Logins</h4>
                  <div className="space-y-1">
                    {selectedEmployee.loginHistory.map((lh: any) => (
                      <p key={lh.id} className="text-xs text-zinc-500">{new Date(lh.timestamp).toLocaleString()}</p>
                    ))}
                  </div>
                </div>
              )}
              {/* Activity Timeline */}
              {selectedEmployee.activityLogs?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Activity</h4>
                  <div className="space-y-2">
                    {selectedEmployee.activityLogs.map((al: any) => (
                      <div key={al.id} className="text-xs border-l-2 border-zinc-200 pl-3 py-1">
                        <p className="font-medium text-zinc-700">{al.action}</p>
                        <p className="text-zinc-400">{al.entity} &middot; {new Date(al.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
