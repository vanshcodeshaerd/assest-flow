"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  ScatterController,
} from "chart.js";
import { Line, Bar, Doughnut, Pie, Scatter } from "react-chartjs-2";

ChartJS.register(LineElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler, ArcElement, ScatterController);

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DepreciationPage() {
  const [purchaseCost, setPurchaseCost] = useState(50000);
  const [salvageValue, setSalvageValue] = useState(5000);
  const [usefulLife, setUsefulLife] = useState(5);
  const [acqDate, setAcqDate] = useState("2023-01-01");

  const annualDep = usefulLife > 0 ? (purchaseCost - salvageValue) / usefulLife : 0;

  const now = new Date();
  const acq = new Date(acqDate || now.toISOString());
  const ageYears = Math.abs(now.getTime() - acq.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const yearsUsed = Math.min(ageYears, usefulLife);
  let bookValue = purchaseCost - annualDep * yearsUsed;
  bookValue = Math.max(bookValue, salvageValue);
  const totalDep = purchaseCost - bookValue;
  const depPercent = purchaseCost > 0 ? (totalDep / purchaseCost) * 100 : 0;
  const remLife = Math.max(0, usefulLife - ageYears);

  const retirementDate = new Date(acq);
  retirementDate.setFullYear(retirementDate.getFullYear() + usefulLife);
  const retDateStr = retirementDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const chartLife = Math.max(1, Math.ceil(usefulLife));
  const startYear = acq.getFullYear();
  const forecastLabels: string[] = [];
  const forecastData: number[] = [];
  for (let i = 0; i <= chartLife; i++) {
    forecastLabels.push((startYear + i).toString());
    forecastData.push(Math.max(purchaseCost - annualDep * i, salvageValue));
  }

  const scheduleRows: { year: string; startVal: number; dep: number; endVal: number; cumDep: number }[] = [];
  let cumDep = 0;
  for (let i = 0; i < chartLife; i++) {
    const sv = Math.max(purchaseCost - annualDep * i, salvageValue);
    const dep = Math.min(annualDep, sv - salvageValue);
    cumDep += dep;
    const ev = Math.max(sv - dep, salvageValue);
    scheduleRows.push({ year: `${startYear + i}-${startYear + i + 1}`, startVal: sv, dep, endVal: ev, cumDep });
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30">
        <h1 className="text-[22px] font-bold text-gray-900">Depreciation Calculator</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Calculate and forecast asset depreciation using the Straight Line method</p>
      </header>

      <div className="px-8 py-7 flex flex-col gap-6">
        {/* Input + Results Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-5">
          {/* Input Form */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-0">
              <h3 className="text-base font-bold text-gray-900">Asset Financial Data</h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Purchase Cost ($)</label>
                <input
                  type="number"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Salvage Value ($)</label>
                <input
                  type="number"
                  value={salvageValue}
                  onChange={(e) => setSalvageValue(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Acquisition Date</label>
                <input
                  type="date"
                  value={acqDate}
                  onChange={(e) => setAcqDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Useful Life (Years)</label>
                <input
                  type="number"
                  value={usefulLife}
                  onChange={(e) => setUsefulLife(Number(e.target.value) || 1)}
                  min={1}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Depreciation Method</label>
                <select disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed">
                  <option>Straight Line</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calculation Results */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-0">
              <h3 className="text-base font-bold text-gray-900">Calculation Results</h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <ResultItem label="Current Book Value" value={`$${fmt(bookValue)}`} color="text-blue-600" />
              <ResultItem label="Total Depreciation" value={`$${fmt(totalDep)}`} color="text-red-600" />
              <ResultItem label="Depreciation %" value={`${depPercent.toFixed(1)}%`} color="text-orange-600" />
              <ResultItem label="Annual Dep." value={`$${fmt(annualDep)}`} color="text-purple-600" />
              <ResultItem label="Remaining Life" value={`${remLife.toFixed(1)} Yrs`} color="text-emerald-600" />
              <ResultItem label="Retirement Date" value={retDateStr} color="text-gray-700" />
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-base font-bold text-gray-900">Depreciation Forecast Over Useful Life</h3>
          </div>
          <div className="px-6 py-5">
            <div className="h-[350px]">
              <Line
                data={{
                  labels: forecastLabels,
                  datasets: [{
                    label: "Book Value ($)",
                    data: forecastData,
                    borderColor: "#3B82F6",
                    borderWidth: 3,
                    tension: 0.1,
                    fill: true,
                    backgroundColor: "rgba(59,130,246,0.08)",
                    pointBackgroundColor: "#3B82F6",
                    pointRadius: 5,
                    pointHoverRadius: 7,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1E293B", padding: 10, cornerRadius: 8 } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: "rgba(148,163,184,0.1)" }, ticks: { callback: (v) => `$${Number(v).toLocaleString()}`, font: { size: 11 }, color: "#94A3B8" } },
                    x: { grid: { display: false }, ticks: { font: { size: 11, weight: "bold" as const }, color: "#475569" } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Depreciation Schedule Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-base font-bold text-gray-900">Depreciation Schedule</h3>
            <p className="text-xs text-gray-500 mt-0.5">Year-by-year breakdown</p>
          </div>
          <div className="px-6 py-5 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Start Value</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Depreciation</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">End Value</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Cumulative Dep.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scheduleRows.map((row) => (
                  <tr key={row.year} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">${fmt(row.startVal)}</td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right font-medium">-${fmt(row.dep)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">${fmt(row.endVal)}</td>
                    <td className="px-4 py-3 text-sm text-orange-600 text-right">${fmt(row.cumDep)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Intelligence Analytics — 6 charts from prototype */}
        <div className="px-0 pt-2 pb-0">
          <h2 className="text-lg font-bold text-gray-900">Asset Intelligence Analytics</h2>
          <p className="text-xs text-gray-500 mt-0.5">AI-powered insights and financial analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Asset Value Distribution */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Asset Value by Category</h3>
            <div className="h-[200px]">
              <Bar
                data={{
                  labels: ["IT Equip", "Vehicles", "Furniture", "Machinery", "Software"],
                  datasets: [{ data: [450000, 320000, 150000, 280000, 200000], backgroundColor: ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#38BDF8"], borderRadius: 4 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: "rgba(148,163,184,0.1)" }, ticks: { callback: (v) => `$${Number(v) / 1000}K`, font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }}
              />
            </div>
          </div>

          {/* 2. Dept-wise Asset Value */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Department Asset Value</h3>
            <div className="h-[200px]">
              <Doughnut
                data={{
                  labels: ["Engineering", "Operations", "IT", "HR", "Finance"],
                  datasets: [{ data: [35, 25, 20, 10, 10], backgroundColor: ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#F472B6"], borderWidth: 0, cutout: "70%" }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { font: { size: 10 }, padding: 8 } } } }}
              />
            </div>
          </div>

          {/* 3. Depreciation Trend */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Depreciation Trend</h3>
            <div className="h-[200px]">
              <Line
                data={{
                  labels: ["2021", "2022", "2023", "2024", "2025", "2026"],
                  datasets: [{ label: "Book Value", data: [1200, 1050, 900, 750, 600, 450], borderColor: "#3B82F6", borderWidth: 3, tension: 0.4, fill: true, backgroundColor: "rgba(59,130,246,0.08)", pointRadius: 3 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: "rgba(148,163,184,0.1)" }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }}
              />
            </div>
          </div>

          {/* 4. Replacement Forecast */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Replacement Forecast</h3>
            <div className="h-[200px]">
              <Bar
                data={{
                  labels: ["Q3 26", "Q4 26", "Q1 27", "Q2 27", "Q3 27"],
                  datasets: [{ label: "Replacements", data: [15, 28, 12, 45, 20], backgroundColor: "#8B5CF6", borderRadius: 4 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: "rgba(148,163,184,0.1)" }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }}
              />
            </div>
          </div>

          {/* 5. Asset Health Distribution */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Health Distribution</h3>
            <div className="h-[200px]">
              <Pie
                data={{
                  labels: ["Excellent", "Healthy", "Needs Attention", "Replace"],
                  datasets: [{ data: [45, 30, 15, 10], backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"], borderWidth: 0 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { font: { size: 10 }, padding: 8 } } } }}
              />
            </div>
          </div>

          {/* 6. Maintenance vs Depreciation */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Maintenance vs Depreciation</h3>
            <div className="h-[200px]">
              <Scatter
                data={{
                  datasets: [{
                    label: "Assets",
                    data: [{ x: 10, y: 2 }, { x: 20, y: 3 }, { x: 40, y: 5 }, { x: 60, y: 8 }, { x: 80, y: 15 }, { x: 90, y: 22 }],
                    backgroundColor: "#F59E0B",
                    pointRadius: 6,
                  }],
                }}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { title: { display: true, text: "Depreciation %", font: { size: 10 } }, grid: { color: "rgba(148,163,184,0.1)" }, ticks: { font: { size: 10 } } },
                    y: { title: { display: true, text: "Maintenance Count", font: { size: 10 } }, grid: { color: "rgba(148,163,184,0.1)" }, ticks: { font: { size: 10 } } },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="text-[11px] text-gray-500 font-medium">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}
