"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; code: string; }
interface Department { id: string; name: string; }

const STEPS = ["General", "Organization", "Purchase & Warranty", "Additional", "Review"];

export default function RegisterAssetPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    assetTag: "",
    serialNumber: "",
    brand: "",
    model: "",
    manufacturer: "",
    vendor: "",
    description: "",
    notes: "",
    departmentId: "",
    location: "",
    storageRoom: "",
    purchaseDate: "",
    purchaseCost: "",
    warrantyExpiry: "",
    condition: "GOOD",
    status: "AVAILABLE",
  });

  useEffect(() => {
    Promise.all([fetchCategories(), fetchDepartments()]);
  }, []);

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

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.name.trim()) { setError("Asset name is required"); return false; }
      if (!form.categoryId) { setError("Category is required"); return false; }
      if (!form.assetTag.trim()) { setError("Asset tag is required"); return false; }
    }
    return true;
  }

  function nextStep() {
    if (validateStep()) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function prevStep() {
    setStep((s) => Math.max(0, s - 1));
    setError("");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        categoryId: form.categoryId,
        assetTag: form.assetTag,
        condition: form.condition,
        status: form.status,
      };

      if (form.serialNumber) body.serialNumber = form.serialNumber;
      if (form.brand) body.brand = form.brand;
      if (form.model) body.model = form.model;
      if (form.manufacturer) body.manufacturer = form.manufacturer;
      if (form.vendor) body.vendor = form.vendor;
      if (form.description) body.description = form.description;
      if (form.notes) body.notes = form.notes;
      if (form.departmentId) body.departmentId = form.departmentId;
      if (form.location) body.location = form.location;
      if (form.storageRoom) body.storageRoom = form.storageRoom;
      if (form.purchaseDate) body.purchaseDate = form.purchaseDate;
      if (form.purchaseCost) body.purchaseCost = parseFloat(form.purchaseCost);
      if (form.warrantyExpiry) body.warrantyExpiry = form.warrantyExpiry;

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to register asset");
        return;
      }

      router.push(`/admin/assets/${data.asset.id}`);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Register New Asset</h1>
            <p className="text-gray-500 text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
          <button
            onClick={() => router.push("/admin/assets")}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Steps indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <div className={`hidden sm:block ml-2 text-xs ${i <= step ? "text-purple-600 font-medium" : "text-gray-400"}`}>
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-purple-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {/* Step 0: General */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
                <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="e.g. MacBook Pro 16-inch" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={form.categoryId} onChange={(e) => updateForm("categoryId", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Tag *</label>
                <input type="text" value={form.assetTag} onChange={(e) => updateForm("assetTag", e.target.value)} placeholder="Unique physical tag identifier" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                {selectedCategory && form.assetTag && (
                  <p className="text-xs text-gray-500 mt-1">Asset ID will be generated as: {selectedCategory.code}-{new Date().getFullYear()}-XXXXXX</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input type="text" value={form.serialNumber} onChange={(e) => updateForm("serialNumber", e.target.value)} placeholder="Manufacturer serial number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input type="text" value={form.brand} onChange={(e) => updateForm("brand", e.target.value)} placeholder="e.g. Apple" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input type="text" value={form.model} onChange={(e) => updateForm("model", e.target.value)} placeholder="e.g. A2485" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input type="text" value={form.manufacturer} onChange={(e) => updateForm("manufacturer", e.target.value)} placeholder="e.g. Apple Inc." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          )}

          {/* Step 1: Organization */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.departmentId} onChange={(e) => updateForm("departmentId", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">No department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                <input type="text" value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="e.g. Building A, Floor 3" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Room</label>
                <input type="text" value={form.storageRoom} onChange={(e) => updateForm("storageRoom", e.target.value)} placeholder="e.g. Room 301" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => updateForm("status", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select value={form.condition} onChange={(e) => updateForm("condition", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Purchase & Warranty */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input type="text" value={form.vendor} onChange={(e) => updateForm("vendor", e.target.value)} placeholder="Vendor / supplier name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={(e) => updateForm("purchaseDate", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost ($)</label>
                  <input type="number" step="0.01" min="0" value={form.purchaseCost} onChange={(e) => updateForm("purchaseCost", e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                <input type="date" value={form.warrantyExpiry} onChange={(e) => updateForm("warrantyExpiry", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          )}

          {/* Step 3: Additional */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Detailed description of the asset" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} placeholder="Internal notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Review Asset Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <ReviewField label="Name" value={form.name} />
                <ReviewField label="Category" value={selectedCategory?.name || "—"} />
                <ReviewField label="Asset Tag" value={form.assetTag} />
                <ReviewField label="Serial Number" value={form.serialNumber} />
                <ReviewField label="Brand" value={form.brand} />
                <ReviewField label="Model" value={form.model} />
                <ReviewField label="Manufacturer" value={form.manufacturer} />
                <ReviewField label="Vendor" value={form.vendor} />
                <ReviewField label="Department" value={departments.find((d) => d.id === form.departmentId)?.name || "—"} />
                <ReviewField label="Location" value={form.location} />
                <ReviewField label="Storage Room" value={form.storageRoom} />
                <ReviewField label="Condition" value={form.condition} />
                <ReviewField label="Status" value={form.status} />
                <ReviewField label="Purchase Date" value={form.purchaseDate} />
                <ReviewField label="Purchase Cost" value={form.purchaseCost ? `$${parseFloat(form.purchaseCost).toLocaleString()}` : "—"} />
                <ReviewField label="Warranty Expiry" value={form.warrantyExpiry} />
              </div>
              {form.description && (
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Description</span>
                  <p className="text-sm text-gray-700 mt-1">{form.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={nextStep} className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
              >
                {submitting ? "Registering..." : "Register Asset"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
      <p className="text-gray-900">{value || "—"}</p>
    </div>
  );
}
