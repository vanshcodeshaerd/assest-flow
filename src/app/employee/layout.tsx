"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UserInfo {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

const NAV_ITEMS = [
  {
    section: "Main",
    items: [
      { label: "Dashboard", path: "/employee/dashboard", icon: "home" },
      { label: "My Assets", path: "/employee/assets", icon: "box" },
      { label: "Requests", path: "/employee/requests", icon: "clipboard" },
    ],
  },
  {
    section: "Services",
    items: [
      { label: "Book Resource", path: "/employee/bookings", icon: "calendar" },
      { label: "Maintenance", path: "/employee/maintenance", icon: "tool" },
    ],
  },
];

function NavIcon({ name, size = 20 }: { name: string; size?: number }) {
  const s = `${size}`;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "home":
      return <svg {...common}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case "box":
      return <svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
    case "clipboard":
      return <svg {...common}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case "tool":
      return <svg {...common}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const isLoginPage = pathname === "/employee/login";

  useEffect(() => {
    if (!isLoginPage) fetchUser();
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setCollapsed(true);
    }
  }, [isLoginPage]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUser(data.user);
      }
    } catch {}
  }

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    router.push("/employee/login");
  }

  function isActive(path: string) {
    if (path === "/employee/dashboard") return pathname === "/employee/dashboard";
    return pathname.startsWith(path) && path !== "/employee/dashboard";
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <aside className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 flex flex-col ${collapsed ? "w-[72px]" : "w-[260px]"}`}>
        <div className="flex items-center gap-3 px-5 py-5 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          {!collapsed && <span className="text-lg font-bold text-gray-900">AssetFlow</span>}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-6 -right-3.5 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-400 shadow-sm z-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
          {NAV_ITEMS.map((section) => (
            <div key={section.section} className="mb-4">
              {!collapsed && (
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 py-2">
                  {section.section}
                </div>
              )}
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.path}>
                      <button
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center gap-3 rounded-lg transition-all text-[13px] font-medium ${collapsed ? "justify-center p-2.5" : "px-3 py-2.5"} ${active ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className={active ? "text-emerald-600" : ""}><NavIcon name={item.icon} /></span>
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-gray-200 p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</div>
                <div className="text-[11px] text-gray-500">{user?.role}</div>
              </div>
            )}
            <button onClick={handleLogout} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-[72px]" : "ml-[260px]"}`}>
        {children}
      </main>
    </div>
  );
}
