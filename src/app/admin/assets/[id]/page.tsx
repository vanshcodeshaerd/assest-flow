"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface AssetDetail {
  id: string;
  assetId: string;
  assetTag: string;
  name: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  manufacturer: string | null;
  vendor: string | null;
  description: string | null;
  notes: string | null;
  condition: string;
  status: string;
  location: string | null;
  storageRoom: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  warrantyExpiry: string | null;
  healthScore: number | null;
  usageScore: string | null;
  riskScore: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; code: string };
  department: { id: string; name: string } | null;
  allocations: Allocation[];
  maintenance: MaintenanceRecord[];
  transfers: Transfer[];
  timeline: TimelineEntry[];
  documents: AssetDoc[];
  ai: { healthScore: number; usageScore: string; riskScore: string; recommendations: string[] } | null;
}

interface Allocation {
  id: string;
  allocatedDate: string;
  expectedReturn: string | null;
  returnDate: string | null;
  returnedAt: string | null;
  status: string;
  notes: string | null;
  holder: { id: string; firstName: string; lastName: string; email: string; employeeId: string | null };
}

interface MaintenanceRecord {
  id: string;
  type: string;
  priority: string;
  description: string;
  vendor: string | null;
  engineer: string | null;
  cost: number | null;
  status: string;
  beforeCondition: string | null;
  afterCondition: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
}

interface Transfer {
  id: string;
  fromEmployeeId: string | null;
  toEmployeeId: string | null;
  fromDepartmentId: string | null;
  toDepartmentId: string | null;
  fromLocation: string | null;
  toLocation: string | null;
  reason: string | null;
  createdAt: string;
}

interface TimelineEntry {
  id: string;
  event: string;
  performedBy: string | null;
  metadata: string | null;
  createdAt: string;
}

interface AssetDoc {
  id: string;
  fileName: string;
  fileType: string;
  docType: string;
  uploadedAt: string;
}

const TABS = ["Overview", "Allocation", "Maintenance", "Transfers", "Timeline", "AI Insights"];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  ALLOCATED: "bg-blue-50 text-blue-700 border-blue-200",
  MAINTENANCE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  RESERVED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DAMAGED: "bg-red-50 text-red-700 border-red-200",
  LOST: "bg-gray-100 text-gray-700 border-gray-300",
  RETIRED: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchAsset();
    fetchEmployees();
    fetchDepartments();
  }, [id]);

  async function fetchAsset() {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAsset(data.asset);
      } else {
        showToast("Asset not found", "error");
      }
    } catch {
      showToast("Failed to load asset", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const res = await fetch("/api/users?limit=100&status=ACTIVE");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
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

  function showToast(message: string, type: string = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAllocate(employeeId: string, expectedReturn: string, notes: string) {
    try {
      const res = await fetch(`/api/assets/${id}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, expectedReturn: expectedReturn || null, notes: notes || null }),
      });
      if (res.ok) {
        showToast("Asset allocated successfully");
        setShowAllocateModal(false);
        fetchAsset();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to allocate", "error");
      }
    } catch {
      showToast("Failed to allocate", "error");
    }
  }

  async function handleReturn() {
    try {
      const res = await fetch(`/api/assets/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        showToast("Asset returned successfully");
        fetchAsset();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to return", "error");
      }
    } catch {
      showToast("Failed to return asset", "error");
    }
  }

  async function handleMaintenanceCreate(formData: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/assets/${id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast("Maintenance request created");
        setShowMaintenanceModal(false);
        fetchAsset();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to create maintenance", "error");
      }
    } catch {
      showToast("Failed to create maintenance", "error");
    }
  }

  async function handleTransfer(formData: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/assets/${id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast("Asset transferred successfully");
        setShowTransferModal(false);
        fetchAsset();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to transfer", "error");
      }
    } catch {
      showToast("Failed to transfer", "error");
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Status changed to ${newStatus}`);
        setShowStatusModal(false);
        fetchAsset();
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to update status", "error");
      }
    } catch {
      showToast("Failed to update status", "error");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Asset not found</p>
          <button onClick={() => router.push("/admin/assets")} className="text-purple-600 hover:underline">Back to Assets</button>
        </div>
      </div>
    );
  }

  const currentHolder = asset.allocations.find((a) => a.status === "ACTIVE");
  const ai = asset.ai;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.push("/admin/assets")} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Assets
            </button>
            <div className="flex gap-2">
              <a href={`/api/assets/${id}/qr`} target="_blank" className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                QR Code
              </a>
              {asset.status === "AVAILABLE" && (
                <button onClick={() => setShowAllocateModal(true)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Allocate
                </button>
              )}
              {asset.status === "ALLOCATED" && (
                <button onClick={handleReturn} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Return
                </button>
              )}
              <button onClick={() => setShowTransferModal(true)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                Transfer
              </button>
              <button onClick={() => setShowMaintenanceModal(true)} className="px-3 py-1.5 text-xs border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50">
                Maintenance
              </button>
              <button onClick={() => setShowStatusModal(true)} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                Change Status
              </button>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[asset.status] || "bg-gray-100"}`}>
                  {asset.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="font-mono">{asset.assetId}</span>
                <span>{asset.category.name}</span>
                {asset.brand && <span>{asset.brand} {asset.model || ""}</span>}
                {asset.department && <span>{asset.department.name}</span>}
              </div>
            </div>
            {ai && (
              <div className="flex gap-4">
                <ScoreCard label="Health" value={ai.healthScore} max={100} />
                <ScoreChip label="Usage" value={ai.usageScore} />
                <ScoreChip label="Risk" value={ai.riskScore} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === i ? "text-purple-600 border-purple-600" : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {tab === 0 && <OverviewTab asset={asset} currentHolder={currentHolder} />}
        {tab === 1 && <AllocationTab allocations={asset.allocations} />}
        {tab === 2 && <MaintenanceTab records={asset.maintenance} />}
        {tab === 3 && <TransferTab transfers={asset.transfers} />}
        {tab === 4 && <TimelineTab entries={asset.timeline} />}
        {tab === 5 && ai && <AIInsightsTab ai={ai} asset={asset} />}
      </div>

      {/* Modals */}
      {showAllocateModal && (
        <AllocateModal employees={employees} onSubmit={handleAllocate} onClose={() => setShowAllocateModal(false)} />
      )}
      {showMaintenanceModal && (
        <MaintenanceModal onSubmit={handleMaintenanceCreate} onClose={() => setShowMaintenanceModal(false)} />
      )}
      {showTransferModal && (
        <TransferModal employees={employees} departments={departments} onSubmit={handleTransfer} onClose={() => setShowTransferModal(false)} />
      )}
      {showStatusModal && (
        <StatusModal currentStatus={asset.status} onSubmit={handleStatusChange} onClose={() => setShowStatusModal(false)} />
      )}
    </div>
  );
}

function ScoreCard({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? "text-green-600" : pct >= 40 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };
  return (
    <div className="text-center">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[value] || "bg-gray-100"}`}>{value}</span>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || "—"}</span>
    </div>
  );
}

function OverviewTab({ asset, currentHolder }: { asset: AssetDetail; currentHolder?: Allocation }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">General Information</h3>
        <InfoRow label="Asset ID" value={<span className="font-mono text-purple-600">{asset.assetId}</span>} />
        <InfoRow label="Asset Tag" value={asset.assetTag} />
        <InfoRow label="Category" value={asset.category.name} />
        <InfoRow label="Serial Number" value={asset.serialNumber} />
        <InfoRow label="Brand" value={asset.brand} />
        <InfoRow label="Model" value={asset.model} />
        <InfoRow label="Manufacturer" value={asset.manufacturer} />
        <InfoRow label="Condition" value={asset.condition} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Organization</h3>
        <InfoRow label="Department" value={asset.department?.name} />
        <InfoRow label="Location" value={asset.location} />
        <InfoRow label="Storage Room" value={asset.storageRoom} />
        <InfoRow label="Vendor" value={asset.vendor} />
        <InfoRow label="Purchase Date" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : null} />
        <InfoRow label="Purchase Cost" value={asset.purchaseCost != null ? `$${asset.purchaseCost.toLocaleString()}` : null} />
        <InfoRow label="Warranty Expiry" value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : null} />
        {currentHolder && (
          <InfoRow label="Assigned To" value={`${currentHolder.holder.firstName} ${currentHolder.holder.lastName}`} />
        )}
      </div>
      {(asset.description || asset.notes) && (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          {asset.description && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{asset.description}</p>
            </div>
          )}
          {asset.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes</h4>
              <p className="text-sm text-gray-600">{asset.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AllocationTab({ allocations }: { allocations: Allocation[] }) {
  if (allocations.length === 0) return <EmptyState text="No allocation history" />;
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Employee</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Allocated</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Expected Return</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Returned</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {allocations.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3">{a.holder.firstName} {a.holder.lastName}</td>
              <td className="px-4 py-3 text-gray-500">{new Date(a.allocatedDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-gray-500">{a.expectedReturn ? new Date(a.expectedReturn).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3 text-gray-500">{a.returnedAt ? new Date(a.returnedAt).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MaintenanceTab({ records }: { records: MaintenanceRecord[] }) {
  if (records.length === 0) return <EmptyState text="No maintenance history" />;
  return (
    <div className="space-y-3">
      {records.map((m) => (
        <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100">{m.type}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                m.priority === "CRITICAL" ? "bg-red-100 text-red-700" :
                m.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                m.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                "bg-green-100 text-green-700"
              }`}>{m.priority}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              m.status === "COMPLETED" ? "bg-green-50 text-green-700" :
              m.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" :
              m.status === "CANCELLED" ? "bg-red-50 text-red-700" :
              "bg-yellow-50 text-yellow-700"
            }`}>{m.status}</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{m.description}</p>
          <div className="flex gap-4 text-xs text-gray-500">
            {m.vendor && <span>Vendor: {m.vendor}</span>}
            {m.cost != null && <span>Cost: ${m.cost.toLocaleString()}</span>}
            <span>Created: {new Date(m.createdAt).toLocaleDateString()}</span>
            {m.completedDate && <span>Completed: {new Date(m.completedDate).toLocaleDateString()}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function TransferTab({ transfers }: { transfers: Transfer[] }) {
  if (transfers.length === 0) return <EmptyState text="No transfer history" />;
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">From → To</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transfers.map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                {t.toLocation && <div className="text-xs">{t.fromLocation || "—"} → {t.toLocation}</div>}
                {t.toDepartmentId && <div className="text-xs">Dept transfer</div>}
                {t.toEmployeeId && <div className="text-xs">Employee transfer</div>}
              </td>
              <td className="px-4 py-3 text-gray-500">{t.reason || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineTab({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <EmptyState text="No timeline events" />;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="space-y-4">
        {entries.map((e) => (
          <div key={e.id} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {e.event.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(e.createdAt).toLocaleString()}
                {e.metadata && (() => { try { const m = JSON.parse(e.metadata); return typeof m === "object" && !Array.isArray(m) ? ` — ${Object.entries(m).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(", ")}` : ""; } catch { return ""; } })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightsTab({ ai, asset }: { ai: NonNullable<AssetDetail["ai"]>; asset: AssetDetail }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Health Score</h4>
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg viewBox="0 0 36 36" className="w-24 h-24">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={ai.healthScore >= 70 ? "#22c55e" : ai.healthScore >= 40 ? "#eab308" : "#ef4444"}
                strokeWidth="3"
                strokeDasharray={`${ai.healthScore}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{ai.healthScore}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">{ai.healthScore >= 70 ? "Good condition" : ai.healthScore >= 40 ? "Needs attention" : "Critical"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Usage Score</h4>
          <div className={`text-3xl font-bold mt-6 ${ai.usageScore === "HIGH" ? "text-blue-600" : ai.usageScore === "MEDIUM" ? "text-yellow-600" : "text-gray-400"}`}>
            {ai.usageScore}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {ai.usageScore === "HIGH" ? "Frequently used" : ai.usageScore === "MEDIUM" ? "Moderate usage" : "Underutilized"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Risk Score</h4>
          <div className={`text-3xl font-bold mt-6 ${
            ai.riskScore === "CRITICAL" ? "text-red-600" : ai.riskScore === "HIGH" ? "text-orange-600" : ai.riskScore === "MEDIUM" ? "text-yellow-600" : "text-green-600"
          }`}>
            {ai.riskScore}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {ai.riskScore === "CRITICAL" ? "Immediate action needed" : ai.riskScore === "HIGH" ? "Monitor closely" : ai.riskScore === "MEDIUM" ? "Standard monitoring" : "No concerns"}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
        <div className="space-y-2">
          {ai.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-purple-500 mt-0.5">●</span>
              <span className="text-gray-700">{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
      <p className="text-gray-400">{text}</p>
    </div>
  );
}

function AllocateModal({ employees, onSubmit, onClose }: { employees: { id: string; firstName: string; lastName: string }[]; onSubmit: (id: string, ret: string, notes: string) => void; onClose: () => void }) {
  const [employeeId, setEmployeeId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <ModalWrapper title="Allocate Asset" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Select employee...</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date</label>
          <input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button onClick={() => employeeId && onSubmit(employeeId, expectedReturn, notes)} disabled={!employeeId} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">Allocate</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function MaintenanceModal({ onSubmit, onClose }: { onSubmit: (data: Record<string, unknown>) => void; onClose: () => void }) {
  const [type, setType] = useState("CORRECTIVE");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [cost, setCost] = useState("");
  return (
    <ModalWrapper title="Create Maintenance Request" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="PREVENTIVE">Preventive</option>
              <option value="CORRECTIVE">Corrective</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="WARRANTY_REPAIR">Warranty Repair</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button onClick={() => description && onSubmit({ type, priority, description, vendor: vendor || null, cost: cost ? parseFloat(cost) : null })} disabled={!description} className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg disabled:opacity-50">Create</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function TransferModal({ employees, departments, onSubmit, onClose }: { employees: { id: string; firstName: string; lastName: string }[]; departments: { id: string; name: string }[]; onSubmit: (data: Record<string, unknown>) => void; onClose: () => void }) {
  const [toEmployeeId, setToEmployeeId] = useState("");
  const [toDepartmentId, setToDepartmentId] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [reason, setReason] = useState("");
  return (
    <ModalWrapper title="Transfer Asset" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Employee</label>
          <select value={toEmployeeId} onChange={(e) => setToEmployeeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">None</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Department</label>
          <select value={toDepartmentId} onChange={(e) => setToDepartmentId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">None</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
          <input type="text" value={toLocation} onChange={(e) => setToLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button onClick={() => (toEmployeeId || toDepartmentId || toLocation) && onSubmit({ toEmployeeId: toEmployeeId || null, toDepartmentId: toDepartmentId || null, toLocation: toLocation || null, reason: reason || null })} disabled={!toEmployeeId && !toDepartmentId && !toLocation} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg disabled:opacity-50">Transfer</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function StatusModal({ currentStatus, onSubmit, onClose }: { currentStatus: string; onSubmit: (status: string) => void; onClose: () => void }) {
  const [status, setStatus] = useState(currentStatus);
  const statuses = ["AVAILABLE", "MAINTENANCE", "RESERVED", "DAMAGED", "LOST", "DISPOSED", "RETIRED"];
  return (
    <ModalWrapper title="Change Asset Status" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Current status: <span className="font-medium">{currentStatus}</span></p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
          <button onClick={() => onSubmit(status)} disabled={status === currentStatus} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg disabled:opacity-50">Update</button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
