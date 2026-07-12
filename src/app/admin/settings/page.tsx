"use client";

import { useEffect, useState } from "react";

interface OrgSettings {
  companyName: string;
  email: string;
  timezone: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.user); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-30">
        <h1 className="text-[22px] font-bold text-gray-900">Settings</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Manage your application preferences</p>
      </header>

      <div className="px-8 py-7 flex flex-col gap-6 max-w-3xl">
        {/* Profile */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-base font-bold text-gray-900">Profile</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your account information</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold flex items-center justify-center">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-base font-bold text-gray-900">Appearance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Customize the look and feel</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Theme</div>
                <div className="text-xs text-gray-500">Choose your preferred theme</div>
              </div>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Compact Mode</div>
                <div className="text-xs text-gray-500">Reduce spacing for denser layout</div>
              </div>
              <div className="w-10 h-6 rounded-full bg-gray-200 relative cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white shadow absolute left-1 top-1 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <h3 className="text-base font-bold text-gray-900">Notifications</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure alert preferences</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            {[
              { label: "Email Notifications", desc: "Receive email alerts for important events" },
              { label: "Maintenance Alerts", desc: "Get notified about upcoming maintenance" },
              { label: "Asset Returns", desc: "Alerts for upcoming asset returns" },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{pref.label}</div>
                  <div className="text-xs text-gray-500">{pref.desc}</div>
                </div>
                <div className="w-10 h-6 rounded-full bg-blue-500 relative cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white shadow absolute right-1 top-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
