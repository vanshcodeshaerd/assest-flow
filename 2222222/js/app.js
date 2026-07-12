'use strict';

/* ============================================================================
   AssetFlow — Enterprise Asset Management Dashboard
   Version 3.2 | Production Build
   ============================================================================
   This file powers ALL interactivity for the AssetFlow dashboard including:
   - Dynamic KPI card rendering with sparkline charts
   - Chart.js visualizations (lifecycle, department, utilization, maintenance)
   - Real-time alerts, activity timeline, and notification center
   - Booking calendar, returns table, and audit status ring
   - Sidebar navigation, search, FAB menu, and keyboard shortcuts
   - Scroll-triggered animations via Intersection Observer
   ========================================================================= */

/* --------------------------------------------------------------------------
   DATA CONSTANTS
   -------------------------------------------------------------------------- */

const COMPANY_DATA = {
  totalEmployees: 420,
  departments: 12,
  totalAssets: 1250,
  sharedResources: 65,
  maintenanceRequests: 38,
  vehicles: 12,
  meetingRooms: 18,
  activeAllocations: 650,
  trackingAccuracy: 95
};

const KPI_DATA = [
  { id: 'available', label: 'Assets Available', value: 487, trend: '+12', trendDirection: 'up', icon: 'check-circle', sparkline: [420, 435, 450, 460, 470, 487] },
  { id: 'allocated', label: 'Assets Allocated', value: 650, trend: '+8', trendDirection: 'up', icon: 'share-2', sparkline: [600, 610, 625, 635, 640, 650] },
  { id: 'maintenance', label: 'Maintenance Today', value: 12, trend: '-3', trendDirection: 'down', icon: 'tool', sparkline: [18, 15, 14, 16, 13, 12] },
  { id: 'bookings', label: 'Active Bookings', value: 34, trend: '+5', trendDirection: 'up', icon: 'calendar', sparkline: [22, 25, 28, 30, 32, 34] },
  { id: 'transfers', label: 'Pending Transfers', value: 8, trend: '-2', trendDirection: 'down', icon: 'repeat', sparkline: [15, 12, 10, 9, 10, 8] },
  { id: 'returns', label: 'Upcoming Returns', value: 23, trend: '+4', trendDirection: 'up', icon: 'rotate-ccw', sparkline: [15, 17, 19, 20, 21, 23] },
  { id: 'assetValue', label: 'Current Asset Value', value: '$1.4M', trend: '+2.1%', trendDirection: 'up', icon: 'trending-up', sparkline: [1.2, 1.25, 1.3, 1.32, 1.38, 1.4] },
  { id: 'totDepreciation', label: 'Total Depreciation', value: '$450K', trend: '+1.5%', trendDirection: 'up', icon: 'trending-down', sparkline: [400, 410, 420, 430, 440, 450] },
  { id: 'nearEOL', label: 'Assets Near End of Life', value: 42, trend: '+5', trendDirection: 'up', icon: 'alert-circle', sparkline: [20, 25, 28, 32, 38, 42] },
  { id: 'reqReplacement', label: 'Require Replacement', value: 18, trend: '-3', trendDirection: 'down', icon: 'refresh-cw', sparkline: [30, 28, 25, 22, 21, 18] }
];

const LIFECYCLE_DATA = {
  labels: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
  values: [487, 650, 45, 38, 3, 22, 5],
  colors: ['#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#94A3B8', '#6B7280']
};

const DEPARTMENT_DATA = {
  departments: ['IT', 'HR', 'Finance', 'Operations', 'Engineering', 'Admin'],
  allocated: [185, 62, 78, 145, 120, 60],
  available: [45, 28, 32, 55, 40, 35],
  maintenance: [8, 3, 5, 12, 7, 3]
};

const ALERTS_DATA = [
  { type: 'critical', icon: 'alert-triangle', title: '3 Overdue Asset Returns', description: 'Laptops AF-014, AF-089, AF-102 past return date by 5+ days', time: '2 hours ago', action: 'Review' },
  { type: 'warning', icon: 'clock', title: '2 Pending Maintenance Approvals', description: 'Vehicle V-012 oil change and Printer PR-008 toner replacement', time: '3 hours ago', action: 'Approve' },
  { type: 'critical', icon: 'search', title: '1 Audit Discrepancy Detected', description: 'Monitor MN-045 location mismatch in Building B audit', time: '5 hours ago', action: 'Investigate' },
  { type: 'warning', icon: 'calendar', title: '4 Assets Nearing Retirement', description: 'Desktop PC series DP-001 to DP-004 exceed 5-year lifecycle', time: '1 day ago', action: 'Plan' },
  { type: 'info', icon: 'info', title: 'Monthly Report Ready', description: 'June 2026 asset utilization report has been generated', time: '1 day ago', action: 'View' }
];

const ACTIVITY_DATA = [
  { icon: 'laptop', title: 'Laptop AF-014 assigned to Rahul Sharma', user: 'Admin Sarah', time: '10 min ago', status: 'completed', statusColor: 'success' },
  { icon: 'truck', title: 'Vehicle V-023 returned by Priya Patel', user: 'Self-service', time: '25 min ago', status: 'completed', statusColor: 'success' },
  { icon: 'check-circle', title: 'Maintenance request #MT-089 approved', user: 'Manager Vikram', time: '1 hour ago', status: 'approved', statusColor: 'primary' },
  { icon: 'building', title: 'Conference Room B booked for Project Alpha', user: 'Team Lead Ankit', time: '2 hours ago', status: 'booked', statusColor: 'warning' },
  { icon: 'printer', title: 'Printer PR-015 transferred to Finance Dept', user: 'Admin Sarah', time: '3 hours ago', status: 'transferred', statusColor: 'primary' },
  { icon: 'monitor', title: 'Monitor MN-032 flagged for inspection', user: 'Audit Bot', time: '4 hours ago', status: 'flagged', statusColor: 'danger' }
];

const MAINTENANCE_DATA = {
  status: { pending: 12, approved: 8, inProgress: 14, resolved: 4 },
  priority: { critical: 3, high: 8, medium: 18, low: 9 }
};

const RETURNS_TABLE_DATA = [
  { asset: 'Laptop - Dell XPS 15', assetId: 'AF-014', employee: 'Rahul Sharma', department: 'Engineering', returnDate: '2026-07-10', daysLeft: -2, priority: 'critical' },
  { asset: 'Projector - Epson EB', assetId: 'PJ-003', employee: 'Meera Reddy', department: 'HR', returnDate: '2026-07-11', daysLeft: -1, priority: 'critical' },
  { asset: 'Vehicle - Toyota Innova', assetId: 'V-008', employee: 'Amit Kumar', department: 'Operations', returnDate: '2026-07-12', daysLeft: 0, priority: 'warning' },
  { asset: 'iPad Pro 12.9"', assetId: 'TB-021', employee: 'Sneha Iyer', department: 'Finance', returnDate: '2026-07-14', daysLeft: 2, priority: 'warning' },
  { asset: 'MacBook Pro 16"', assetId: 'AF-156', employee: 'Vikram Singh', department: 'IT', returnDate: '2026-07-16', daysLeft: 4, priority: 'normal' },
  { asset: 'Camera - Canon EOS', assetId: 'CM-002', employee: 'Pooja Nair', department: 'Admin', returnDate: '2026-07-18', daysLeft: 6, priority: 'normal' },
  { asset: 'Drone - DJI Mavic', assetId: 'DR-001', employee: 'Arjun Das', department: 'Operations', returnDate: '2026-07-20', daysLeft: 8, priority: 'normal' }
];

const UTILIZATION_DATA = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  utilized: [72, 75, 78, 82, 80, 85],
  idle: [28, 25, 22, 18, 20, 15],
  benchmark: [80, 80, 80, 80, 80, 80]
};

const BOOKING_DATA = [
  { title: 'Project Alpha Standup', type: 'meeting', room: 'Conference Room A', time: '09:00 - 09:30', color: 'primary' },
  { title: 'Client Visit - Tata Motors', type: 'meeting', room: 'Board Room', time: '10:00 - 12:00', color: 'primary' },
  { title: 'Vehicle V-005 Reserved', type: 'vehicle', details: 'Site visit - Pune', time: '08:00 - 17:00', color: 'accent' },
  { title: 'HR Interview Panel', type: 'room', room: 'Meeting Room 3', time: '14:00 - 16:00', color: 'purple' },
  { title: 'IT Equipment Setup', type: 'room', room: 'Server Room', time: '11:00 - 13:00', color: 'purple' },
  { title: 'Vehicle V-012 Reserved', type: 'vehicle', details: 'Airport pickup', time: '15:00 - 18:00', color: 'accent' }
];

const AUDIT_DATA = {
  currentCycle: 'Q3 2026 - Annual Asset Audit',
  assetsVerified: 1089,
  totalAssets: 1250,
  missing: 3,
  damaged: 7,
  completionPercent: 87
};

const NOTIFICATIONS_DATA = [
  { type: 'transfer', icon: 'repeat', title: 'Transfer Approved', text: 'Monitor MN-023 transfer to IT Department approved by Manager Vikram', time: '5 min ago', unread: true },
  { type: 'maintenance', icon: 'wrench', title: 'Maintenance Completed', text: 'Vehicle V-003 service completed. Ready for allocation.', time: '30 min ago', unread: true },
  { type: 'booking', icon: 'calendar', title: 'Booking Reminder', text: 'Conference Room B booked for 2:00 PM today - Project Review', time: '1 hour ago', unread: true },
  { type: 'audit', icon: 'clipboard', title: 'Audit Discrepancy', text: 'Keyboard KB-089 not found at registered location (Desk F-12)', time: '2 hours ago', unread: false },
  { type: 'overdue', icon: 'alert-circle', title: 'Asset Overdue', text: 'Laptop AF-014 return is overdue by 2 days. Employee: Rahul Sharma', time: '3 hours ago', unread: false },
  { type: 'system', icon: 'bell', title: 'System Update', text: 'AssetFlow v3.2 maintenance window scheduled for Sunday 2:00 AM', time: '5 hours ago', unread: false }
];


/* --------------------------------------------------------------------------
   CHART INSTANCE REGISTRY
   Stored globally so we can destroy / update charts later if needed.
   -------------------------------------------------------------------------- */
const chartInstances = {};


/* --------------------------------------------------------------------------
   SVG ICON HELPER — getIcon(name)
   Returns an inline SVG string (20×20, stroke-based, Lucide-inspired).
   -------------------------------------------------------------------------- */
function getIcon(name, size = 20) {
  const attrs = `xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;

  const icons = {
    /* ── Status & Actions ─────────────────────────────────────────────── */
    'check-circle': `<svg ${attrs}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    'share-2': `<svg ${attrs}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    'tool': `<svg ${attrs}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    'calendar': `<svg ${attrs}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    'repeat': `<svg ${attrs}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
    'rotate-ccw': `<svg ${attrs}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,

    /* ── Alerts ────────────────────────────────────────────────────────── */
    'alert-triangle': `<svg ${attrs}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    'clock': `<svg ${attrs}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    'search': `<svg ${attrs}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    'info': `<svg ${attrs}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,

    /* ── Objects ───────────────────────────────────────────────────────── */
    'laptop': `<svg ${attrs}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`,
    'truck': `<svg ${attrs}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    'building': `<svg ${attrs}><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
    'printer': `<svg ${attrs}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    'monitor': `<svg ${attrs}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,

    /* ── Notification Icons ───────────────────────────────────────────── */
    'wrench': `<svg ${attrs}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    'clipboard': `<svg ${attrs}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    'alert-circle': `<svg ${attrs}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    'bell': `<svg ${attrs}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,

    /* ── UI Controls ──────────────────────────────────────────────────── */
    'plus': `<svg ${attrs}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    'x': `<svg ${attrs}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    'chevron-left': `<svg ${attrs}><polyline points="15 18 9 12 15 6"/></svg>`,
    'chevron-right': `<svg ${attrs}><polyline points="9 18 15 12 9 6"/></svg>`,
    'filter': `<svg ${attrs}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    'download': `<svg ${attrs}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    'refresh-cw': `<svg ${attrs}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
    'eye': `<svg ${attrs}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    'more-horizontal': `<svg ${attrs}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
    'arrow-up': `<svg ${attrs}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
    'arrow-down': `<svg ${attrs}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,

    /* ── Navigation ───────────────────────────────────────────────────── */
    'settings': `<svg ${attrs}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    'log-out': `<svg ${attrs}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    'user': `<svg ${attrs}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    'users': `<svg ${attrs}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    'box': `<svg ${attrs}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    'layers': `<svg ${attrs}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    'bar-chart-2': `<svg ${attrs}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    'file-text': `<svg ${attrs}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    'shield': `<svg ${attrs}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    'grid': `<svg ${attrs}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    'home': `<svg ${attrs}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    'book-open': `<svg ${attrs}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    'check-square': `<svg ${attrs}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    'trending-up': `<svg ${attrs}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    'trending-down': `<svg ${attrs}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
    'activity': `<svg ${attrs}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    'zap': `<svg ${attrs}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    'package': `<svg ${attrs}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
    'map-pin': `<svg ${attrs}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    'hash': `<svg ${attrs}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`,
    'menu': `<svg ${attrs}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`
  };

  return icons[name] || `<svg ${attrs}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
}


/* --------------------------------------------------------------------------
   UTILITY HELPERS
   -------------------------------------------------------------------------- */

/** Formats a number with locale-aware thousands separators */
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN');
}

/** Formats an ISO date string into a readable format (e.g. "12 Jul 2026") */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Returns a time-of-day greeting */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** Pass-through for relative time strings already in human-readable format */
function getRelativeTime(timeStr) {
  return timeStr;
}


/* --------------------------------------------------------------------------
   SPARKLINE DRAWER — drawSparkline(canvas, data, color)
   Renders a small area-line chart on the given <canvas> element.
   -------------------------------------------------------------------------- */
function drawSparkline(canvas, data, color) {
  if (!canvas || !data || data.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const w = 80;
  const h = 32;

  /* High-DPI canvas sizing */
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  /* Normalize data to canvas dimensions with 4px padding */
  const padding = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (w - padding * 2) / (data.length - 1);

  const points = data.map((val, i) => ({
    x: padding + i * stepX,
    y: padding + (1 - (val - min) / range) * (h - padding * 2)
  }));

  /* Draw filled area with gradient */
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, color + '33'); /* ~20% opacity */
  gradient.addColorStop(1, color + '00'); /* transparent */

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
  }

  /* Close the shape along the bottom */
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.lineTo(points[0].x, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  /* Draw the line on top */
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  /* Draw end-point dot */
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}


/* ============================================================================
   INITIALIZATION — DOMContentLoaded ENTRY POINT
   ============================================================================ */
document.addEventListener('DOMContentLoaded', function () {
  init();
});

function init() {
  initSidebar();
  initHeader();
  initWelcome();
  renderKPICards();
  renderAlerts();
  initLifecycleChart();
  renderLifecycleLegend();
  initDepartmentChart();
  renderActivityTimeline();
  renderQuickActions();
  initMaintenanceSection();
  renderBookingCalendar();
  renderReturnsTable();
  initUtilizationChart();
  renderAuditStatus();
  renderNotificationCenter();
  initFAB();
  initAnimations();
  initSearch();
  initTooltips();
  initKeyboardShortcuts();
  
  /* Asset Intelligence Initialization */
  initAssetIntelligenceCharts();
  initDepreciationCalculator();
  initModals();

  console.log('[AssetFlow] Dashboard initialized successfully.');
}


/* --------------------------------------------------------------------------
   1. initSidebar()
   -------------------------------------------------------------------------- */
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  const navItems = document.querySelectorAll('.sidebar .nav-item');
  const logoutBtn = document.querySelector('#logoutBtn, .sidebar-logout, .sidebar .logout-btn, .sidebar [data-action="logout"]');

  /* Toggle collapsed state */
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
      /* Persist state */
      const isCollapsed = sidebar.classList.contains('collapsed');
      try { localStorage.setItem('assetflow_sidebar', isCollapsed ? 'collapsed' : 'expanded'); } catch (_) { /* noop */ }
    });

    /* Restore saved state (desktop only) */
    try {
      if (window.innerWidth >= 1024 && localStorage.getItem('assetflow_sidebar') === 'collapsed') {
        sidebar.classList.add('collapsed');
      }
    } catch (_) { /* noop */ }

    /* Collapse sidebar on mobile by default */
    if (window.innerWidth < 1024) {
      sidebar.classList.add('collapsed');
    }
  }

  /* Nav item active-state handling */
  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      navItems.forEach(function (n) { n.classList.remove('active'); });
      item.classList.add('active');

      const page = item.dataset.page;
      const pageTitle = document.querySelector('.page-title');
      if (pageTitle && page) {
        pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
      }

      /* Toggle View Visibility */
      if (page) {
        document.querySelectorAll('.page-view').forEach(function(view) {
          view.style.display = 'none';
          view.classList.remove('active');
        });
        
        const activeView = document.getElementById('view-' + page);
        if (activeView) {
          activeView.style.display = 'block';
          activeView.classList.add('active');
          /* Re-trigger animations if any */
          const animatedElements = activeView.querySelectorAll('.animate-fade-in-up');
          animatedElements.forEach(function(el) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
          
          /* Call specific render functions for views */
          if (page === 'assets') renderAssetsView();
          if (page === 'employees') renderEmployeesView();
          if (page === 'bookings') renderBookingsViewPage();
          if (page === 'notifications') renderFullNotificationFeed();
          if (page === 'allocations') renderAllocationsView();
          if (page === 'departments') renderDepartmentsView();
          if (page === 'reports') renderReportsView();
        }
      }

      /* If on mobile, close sidebar */
      if (window.innerWidth < 1024 && sidebar) {
        sidebar.classList.add('collapsed');
      }
    });
  });

  /* Logout button */
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('Are you sure you want to log out of AssetFlow?')) {
        alert('You have been logged out. Redirecting to login page…');
      }
    });
  }

  /* If no toggle button exists, create one for mobile */
  if (!toggleBtn && sidebar) {
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'sidebar-toggle mobile-only';
    mobileToggle.innerHTML = getIcon('menu');
    mobileToggle.setAttribute('aria-label', 'Toggle navigation');
    mobileToggle.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
    });
    document.body.appendChild(mobileToggle);
  }
}


/* --------------------------------------------------------------------------
   2. initHeader()
   -------------------------------------------------------------------------- */
function initHeader() {
  /* Search bar focus/blur visual effects */
  const searchInput = document.querySelector('.search-bar input, .header-search input, #globalSearch');
  const searchWrap = document.querySelector('.search-bar, .header-search');

  if (searchInput && searchWrap) {
    searchInput.addEventListener('focus', function () {
      searchWrap.classList.add('focused');
    });
    searchInput.addEventListener('blur', function () {
      searchWrap.classList.remove('focused');
    });
  }

  /* Notification bell toggle */
  const notifBell = document.querySelector('#headerNotifBtn, .notification-bell, .header-notifications, [data-action="notifications"]');
  const notifDropdown = document.querySelector('.notification-dropdown, .notif-dropdown');

  if (notifBell) {
    notifBell.addEventListener('click', function (e) {
      e.stopPropagation();
      if (notifDropdown) {
        notifDropdown.classList.toggle('open');
      } else {
        /* If no dropdown in DOM, show inline summary */
        const unreadCount = NOTIFICATIONS_DATA.filter(function (n) { return n.unread; }).length;
        alert('You have ' + unreadCount + ' unread notification(s).');
      }
    });
  }

  /* Quick Add button */
  const quickAddBtn = document.querySelector('.quick-add-btn, [data-action="quick-add"], .btn-quick-add');
  if (quickAddBtn) {
    quickAddBtn.addEventListener('click', function () {
      alert('Quick Add: Choose an action\n\n• Allocate Asset\n• Create Booking\n• Log Maintenance\n• Register New Asset');
    });
  }

  /* Current date display */
  const dateDisplay = document.querySelector('#currentDate, .current-date, .header-date, [data-bind="currentDate"]');
  if (dateDisplay) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = now.toLocaleDateString('en-IN', options);
  }
}


/* --------------------------------------------------------------------------
   3. initWelcome()
   -------------------------------------------------------------------------- */
function initWelcome() {
  const welcomeEl = document.querySelector('.welcome-title, .greeting-text, [data-bind="greeting"]');
  if (welcomeEl) {
    const greeting = getGreeting();
    /* Preserve any name already in the element, or default to "Admin" */
    const existingText = welcomeEl.textContent.trim();
    const nameMatch = existingText.match(/,\s*(.+)/);
    const name = nameMatch ? nameMatch[1] : 'Admin';
    welcomeEl.textContent = greeting + ', ' + name;
  }

  /* Also update sub-greeting if available */
  const description = document.querySelector('.welcome-description');
  if (description) {
    description.textContent = 'Real-time overview of your company\'s assets and resources — ' + formatDate(new Date().toISOString().split('T')[0]) + '.';
  }
}


/* --------------------------------------------------------------------------
   4. renderKPICards()
   -------------------------------------------------------------------------- */
function renderKPICards() {
  const container = document.querySelector('.kpi-grid, .kpi-cards, .metrics-grid, [data-bind="kpiGrid"]');
  if (!container) return;

  /* Color map for sparklines based on trend direction */
  const sparkColors = {
    up: '#22C55E',
    down: '#EF4444'
  };

  /* Build cards */
  const fragment = document.createDocumentFragment();

  KPI_DATA.forEach(function (kpi, index) {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.setAttribute('data-kpi', kpi.id);
    card.style.animationDelay = (index * 80) + 'ms';

    const trendClass = kpi.trendDirection === 'up' ? 'trend-up' : 'trend-down';
    const trendArrow = kpi.trendDirection === 'up' ? getIcon('arrow-up', 14) : getIcon('arrow-down', 14);
    const sparkColor = kpi.trendDirection === 'up' ? sparkColors.up : sparkColors.down;

    card.innerHTML =
      '<div class="kpi-card__header">' +
        '<div class="kpi-card__icon">' + getIcon(kpi.icon) + '</div>' +
        '<div class="kpi-card__sparkline"><canvas data-sparkline="' + kpi.id + '"></canvas></div>' +
      '</div>' +
      '<div class="kpi-card__body">' +
        '<div class="kpi-card__value">' + formatNumber(kpi.value) + '</div>' +
        '<div class="kpi-card__label">' + kpi.label + '</div>' +
      '</div>' +
      '<div class="kpi-card__footer">' +
        '<span class="kpi-card__trend ' + trendClass + '">' +
          trendArrow +
          '<span>' + kpi.trend + '%</span>' +
        '</span>' +
        '<span class="kpi-card__period">vs last month</span>' +
      '</div>';

    /* Hover animation: subtle lift effect handled via class */
    card.addEventListener('mouseenter', function () {
      card.classList.add('kpi-card--hover');
    });
    card.addEventListener('mouseleave', function () {
      card.classList.remove('kpi-card--hover');
    });

    fragment.appendChild(card);

    /* Draw sparkline after append (needs to be in DOM for dimensions) */
    requestAnimationFrame(function () {
      const canvas = card.querySelector('canvas[data-sparkline]');
      if (canvas) {
        drawSparkline(canvas, kpi.sparkline, sparkColor);
      }
    });
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}


/* --------------------------------------------------------------------------
   5. renderAlerts()
   -------------------------------------------------------------------------- */
function renderAlerts() {
  const container = document.querySelector('.alerts-list, [data-bind="alertsList"]');
  if (!container) return;

  const typeStyles = {
    critical: { borderColor: '#EF4444', bgColor: '#FEF2F2', badgeClass: 'alert-badge--critical' },
    warning:  { borderColor: '#F59E0B', bgColor: '#FFFBEB', badgeClass: 'alert-badge--warning' },
    info:     { borderColor: '#3B82F6', bgColor: '#EFF6FF', badgeClass: 'alert-badge--info' }
  };

  const fragment = document.createDocumentFragment();

  ALERTS_DATA.forEach(function (alert, index) {
    const style = typeStyles[alert.type] || typeStyles.info;
    const item = document.createElement('div');
    item.className = 'alert-item alert-item--' + alert.type;
    item.style.borderLeftColor = style.borderColor;
    item.style.animationDelay = (index * 100) + 'ms';

    item.innerHTML =
      '<div class="alert-item__icon" style="color:' + style.borderColor + '">' + getIcon(alert.icon) + '</div>' +
      '<div class="alert-item__content">' +
        '<div class="alert-item__header">' +
          '<h4 class="alert-item__title">' + alert.title + '</h4>' +
          '<span class="alert-item__time">' + getRelativeTime(alert.time) + '</span>' +
        '</div>' +
        '<p class="alert-item__desc">' + alert.description + '</p>' +
      '</div>' +
      '<button class="alert-item__action btn btn--sm btn--outline" data-action="' + alert.action + '">' +
        alert.action +
      '</button>';

    /* Action button handler */
    const btn = item.querySelector('.alert-item__action');
    btn.addEventListener('click', function () {
      alert('Action: ' + btn.dataset.action);
    });

    fragment.appendChild(item);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}


/* --------------------------------------------------------------------------
   6. initLifecycleChart() — Chart.js Doughnut
   -------------------------------------------------------------------------- */
function initLifecycleChart() {
  const canvas = document.getElementById('lifecycleChart');
  if (!canvas) return;

  /* Destroy existing instance if re-initializing */
  if (chartInstances.lifecycle) {
    chartInstances.lifecycle.destroy();
  }

  const totalAssets = LIFECYCLE_DATA.values.reduce(function (s, v) { return s + v; }, 0);

  /* Center text plugin — draws text in the doughnut hole */
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function (chart) {
      const { ctx, chartArea: { top, bottom, left, right } } = chart;
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = '600 24px "Inter", sans-serif';
      ctx.fillStyle = '#1E293B';
      ctx.fillText(formatNumber(totalAssets), centerX, centerY - 10);

      ctx.font = '400 12px "Inter", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Total Assets', centerX, centerY + 14);

      ctx.restore();
    }
  };

  chartInstances.lifecycle = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: LIFECYCLE_DATA.labels,
      datasets: [{
        data: LIFECYCLE_DATA.values,
        backgroundColor: LIFECYCLE_DATA.colors,
        borderColor: '#ffffff',
        borderWidth: 3,
        borderRadius: 6,
        spacing: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '72%',
      animation: {
        animateRotate: true,
        animateScale: false,
        delay: function (context) {
          return context.dataIndex * 100 + 500;
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: '"Inter", sans-serif', size: 13, weight: '600' },
          bodyFont: { family: '"Inter", sans-serif', size: 12 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            label: function (context) {
              const value = context.parsed;
              const pct = ((value / totalAssets) * 100).toFixed(1);
              return ' ' + context.label + ': ' + formatNumber(value) + ' (' + pct + '%)';
            }
          }
        }
      }
    },
    plugins: [centerTextPlugin]
  });
}


/* --------------------------------------------------------------------------
   6b. renderLifecycleLegend()
   -------------------------------------------------------------------------- */
function renderLifecycleLegend() {
  const legend = document.getElementById('lifecycleLegend');
  if (!legend) return;

  const totalAssets = LIFECYCLE_DATA.values.reduce(function (s, v) { return s + v; }, 0);

  legend.innerHTML = LIFECYCLE_DATA.labels.map(function (label, i) {
    const value = LIFECYCLE_DATA.values[i];
    const color = LIFECYCLE_DATA.colors[i];
    const pct = ((value / totalAssets) * 100).toFixed(1);
    return '<div class="chart-legend-item">' +
      '<span class="chart-legend-dot" style="background:' + color + '"></span>' +
      '<span>' + label + '</span>' +
      '<span class="chart-legend-value">' + formatNumber(value) + ' (' + pct + '%)</span>' +
    '</div>';
  }).join('');
}


/* --------------------------------------------------------------------------
   7. initDepartmentChart() — Chart.js Horizontal Stacked Bar
   -------------------------------------------------------------------------- */
function initDepartmentChart() {
  const canvas = document.getElementById('departmentChart');
  if (!canvas) return;

  if (chartInstances.department) {
    chartInstances.department.destroy();
  }

  chartInstances.department = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: DEPARTMENT_DATA.departments,
      datasets: [
        {
          label: 'Allocated',
          data: DEPARTMENT_DATA.allocated,
          backgroundColor: '#3B82F6',
          borderRadius: 4,
          borderSkipped: false
        },
        {
          label: 'Available',
          data: DEPARTMENT_DATA.available,
          backgroundColor: '#22C55E',
          borderRadius: 4,
          borderSkipped: false
        },
        {
          label: 'Under Maintenance',
          data: DEPARTMENT_DATA.maintenance,
          backgroundColor: '#F59E0B',
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: false
          },
          ticks: {
            font: { family: '"Inter", sans-serif', size: 11 },
            color: '#94A3B8'
          }
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: {
            font: { family: '"Inter", sans-serif', size: 12, weight: '500' },
            color: '#334155'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: { family: '"Inter", sans-serif', size: 11, weight: '500' },
            color: '#475569'
          }
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: '"Inter", sans-serif', size: 13, weight: '600' },
          bodyFont: { family: '"Inter", sans-serif', size: 12 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            label: function (context) {
              return ' ' + context.dataset.label + ': ' + formatNumber(context.parsed.x) + ' assets';
            }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}


/* --------------------------------------------------------------------------
   8. renderActivityTimeline()
   -------------------------------------------------------------------------- */
function renderActivityTimeline() {
  const container = document.querySelector('.timeline, .activity-timeline, [data-bind="activityTimeline"]');
  if (!container) return;

  const statusColorMap = {
    success: '#22C55E',
    primary: '#3B82F6',
    warning: '#F59E0B',
    danger:  '#EF4444'
  };

  const fragment = document.createDocumentFragment();

  ACTIVITY_DATA.forEach(function (item, index) {
    const el = document.createElement('div');
    el.className = 'timeline-item';
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    el.style.transitionDelay = (index * 120) + 'ms';

    const dotColor = statusColorMap[item.statusColor] || '#94A3B8';

    el.innerHTML =
      '<div class="timeline-item__dot" style="background:' + dotColor + '"></div>' +
      '<div class="timeline-item__content">' +
        '<div class="timeline-item__header">' +
          '<span class="timeline-item__icon">' + getIcon(item.icon, 16) + '</span>' +
          '<h4 class="timeline-item__title">' + item.title + '</h4>' +
        '</div>' +
        '<div class="timeline-item__meta">' +
          '<span class="timeline-item__user">' + getIcon('user', 12) + ' ' + item.user + '</span>' +
          '<span class="timeline-item__time">' + getIcon('clock', 12) + ' ' + getRelativeTime(item.time) + '</span>' +
        '</div>' +
        '<span class="timeline-item__status badge badge--' + item.statusColor + '">' + item.status + '</span>' +
      '</div>';

    fragment.appendChild(el);
  });

  container.innerHTML = '';
  container.appendChild(fragment);

  /* Trigger stagger fade-in after a frame */
  requestAnimationFrame(function () {
    const items = container.querySelectorAll('.timeline-item');
    items.forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });
}


/* --------------------------------------------------------------------------
   9. renderQuickActions()
   -------------------------------------------------------------------------- */
function renderQuickActions() {
  const buttons = document.querySelectorAll('.quick-actions-grid .quick-action-btn, .quick-actions .quick-action-btn, .quick-actions button, [data-quick-action]');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const action = btn.dataset.quickAction || btn.dataset.action || btn.textContent.trim();
      alert('Quick Action: ' + action);
    });
  });

  /* If there's a quick-actions container but no buttons, populate default actions */
  const container = document.querySelector('.quick-actions-grid, .quick-actions');
  if (container && container.children.length === 0) {
    const actions = [
      { label: 'Allocate Asset', icon: 'share-2', color: '#3B82F6' },
      { label: 'New Booking', icon: 'calendar', color: '#8B5CF6' },
      { label: 'Log Maintenance', icon: 'tool', color: '#F59E0B' },
      { label: 'Transfer Asset', icon: 'repeat', color: '#22C55E' },
      { label: 'Run Audit', icon: 'shield', color: '#EF4444' },
      { label: 'Generate Report', icon: 'file-text', color: '#06B6D4' }
    ];

    actions.forEach(function (action) {
      const btn = document.createElement('button');
      btn.className = 'quick-action-btn';
      btn.setAttribute('data-quick-action', action.label);
      btn.innerHTML =
        '<span class="quick-action-btn__icon" style="color:' + action.color + '">' + getIcon(action.icon) + '</span>' +
        '<span class="quick-action-btn__label">' + action.label + '</span>';

      btn.addEventListener('click', function () {
        alert('Quick Action: ' + action.label);
      });

      container.appendChild(btn);
    });
  }
}


/* --------------------------------------------------------------------------
   10. initMaintenanceSection()
   -------------------------------------------------------------------------- */
function initMaintenanceSection() {
  /* ── Status Summary Cards ─────────────────────────────────────────── */
  const statusContainer = document.querySelector('#maintenanceStats, .maintenance-stats, .maintenance-status, [data-bind="maintenanceStatus"]');

  if (statusContainer) {
    const statuses = [
      { key: 'pending',    label: 'Pending',     color: '#F59E0B', icon: 'clock' },
      { key: 'approved',   label: 'Approved',    color: '#3B82F6', icon: 'check-circle' },
      { key: 'inProgress', label: 'In Progress', color: '#8B5CF6', icon: 'activity' },
      { key: 'resolved',   label: 'Resolved',    color: '#22C55E', icon: 'check-square' }
    ];

    statusContainer.innerHTML = '';
    statuses.forEach(function (s) {
      const card = document.createElement('div');
      card.className = 'maintenance-status-card';
      card.innerHTML =
        '<div class="maintenance-status-card__icon" style="color:' + s.color + ';background:' + s.color + '14">' +
          getIcon(s.icon, 18) +
        '</div>' +
        '<div class="maintenance-status-card__info">' +
          '<span class="maintenance-status-card__value">' + MAINTENANCE_DATA.status[s.key] + '</span>' +
          '<span class="maintenance-status-card__label">' + s.label + '</span>' +
        '</div>';
      statusContainer.appendChild(card);
    });
  }

  /* ── Priority Stacked Bar Chart ───────────────────────────────────── */
  const priorityCanvas = document.getElementById('maintenancePriorityChart');
  if (priorityCanvas) {
    if (chartInstances.maintenancePriority) {
      chartInstances.maintenancePriority.destroy();
    }

    chartInstances.maintenancePriority = new Chart(priorityCanvas, {
      type: 'bar',
      data: {
        labels: ['Priority Distribution'],
        datasets: [
          { label: 'Critical', data: [MAINTENANCE_DATA.priority.critical], backgroundColor: '#EF4444', borderRadius: 4 },
          { label: 'High',     data: [MAINTENANCE_DATA.priority.high],     backgroundColor: '#F59E0B', borderRadius: 4 },
          { label: 'Medium',   data: [MAINTENANCE_DATA.priority.medium],   backgroundColor: '#3B82F6', borderRadius: 4 },
          { label: 'Low',      data: [MAINTENANCE_DATA.priority.low],      backgroundColor: '#22C55E', borderRadius: 4 }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { color: 'rgba(148,163,184,0.1)', drawBorder: false },
            ticks: { font: { family: '"Inter", sans-serif', size: 11 }, color: '#94A3B8' }
          },
          y: {
            stacked: true,
            display: false
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true, pointStyle: 'circle', padding: 14,
              font: { family: '"Inter", sans-serif', size: 11 }, color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#1E293B',
            titleFont: { family: '"Inter", sans-serif', weight: '600' },
            bodyFont: { family: '"Inter", sans-serif' },
            padding: 10, cornerRadius: 8
          }
        },
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    });
  }

  /* ── Status Pie Chart ─────────────────────────────────────────────── */
  const statusCanvas = document.getElementById('maintenanceStatusChart');
  if (statusCanvas) {
    if (chartInstances.maintenanceStatus) {
      chartInstances.maintenanceStatus.destroy();
    }

    chartInstances.maintenanceStatus = new Chart(statusCanvas, {
      type: 'pie',
      data: {
        labels: ['Pending', 'Approved', 'In Progress', 'Resolved'],
        datasets: [{
          data: [
            MAINTENANCE_DATA.status.pending,
            MAINTENANCE_DATA.status.approved,
            MAINTENANCE_DATA.status.inProgress,
            MAINTENANCE_DATA.status.resolved
          ],
          backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#22C55E'],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true, pointStyle: 'circle', padding: 12,
              font: { family: '"Inter", sans-serif', size: 11 }, color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#1E293B',
            titleFont: { family: '"Inter", sans-serif', weight: '600' },
            bodyFont: { family: '"Inter", sans-serif' },
            padding: 10, cornerRadius: 8,
            callbacks: {
              label: function (ctx) {
                const total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ' ' + ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)';
              }
            }
          }
        },
        animation: { animateRotate: true, duration: 1000 }
      }
    });
  }
}


/* --------------------------------------------------------------------------
   11. renderBookingCalendar()
   -------------------------------------------------------------------------- */
function renderBookingCalendar() {
  /* ── Mini Calendar ────────────────────────────────────────────────── */
  const calContainer = document.querySelector('.mini-calendar, [data-bind="miniCalendar"]');

  if (calContainer) {
    const year = 2026;
    const month = 6; /* July (0-indexed) */
    const today = 12;
    const firstDay = new Date(year, month, 1).getDay(); /* 0=Sun */
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    /* Days that have events (from BOOKING_DATA — they're all "today") */
    const eventDays = new Set([12, 5, 19, 25]); /* Mark a few extra for visual interest */

    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    let html = '<div class="mini-calendar__header">' +
      '<button class="mini-calendar__nav" data-cal-nav="prev">' + getIcon('chevron-left', 16) + '</button>' +
      '<span class="mini-calendar__title">July 2026</span>' +
      '<button class="mini-calendar__nav" data-cal-nav="next">' + getIcon('chevron-right', 16) + '</button>' +
    '</div>';

    html += '<div class="mini-calendar__grid">';

    /* Day-of-week headers */
    dayNames.forEach(function (d) {
      html += '<span class="mini-calendar__day-name">' + d + '</span>';
    });

    /* Empty leading cells */
    for (let i = 0; i < firstDay; i++) {
      html += '<span class="mini-calendar__day mini-calendar__day--empty"></span>';
    }

    /* Day cells */
    for (let d = 1; d <= daysInMonth; d++) {
      let cls = 'mini-calendar__day';
      if (d === today) cls += ' mini-calendar__day--today';
      if (eventDays.has(d)) cls += ' mini-calendar__day--event';
      html += '<span class="' + cls + '" data-day="' + d + '">' + d + '</span>';
    }

    html += '</div>';

    calContainer.innerHTML = html;

    /* Navigation click handlers (visual only for this demo) */
    calContainer.querySelectorAll('[data-cal-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        alert('Calendar navigation: ' + btn.dataset.calNav);
      });
    });

    /* Day click handler */
    calContainer.querySelectorAll('.mini-calendar__day:not(.mini-calendar__day--empty)').forEach(function (dayEl) {
      dayEl.addEventListener('click', function () {
        /* Remove previous selection */
        calContainer.querySelectorAll('.mini-calendar__day--selected').forEach(function (s) {
          s.classList.remove('mini-calendar__day--selected');
        });
        dayEl.classList.add('mini-calendar__day--selected');
      });
    });
  }

  /* ── Today's Bookings List ────────────────────────────────────────── */
  const bookingsContainer = document.querySelector('.bookings-list, [data-bind="bookingsList"]');
  if (!bookingsContainer) return;

  const typeIcons = {
    meeting: 'users',
    vehicle: 'truck',
    room: 'building'
  };

  const colorMap = {
    primary: '#3B82F6',
    accent:  '#F59E0B',
    purple:  '#8B5CF6'
  };

  bookingsContainer.innerHTML = '';

  BOOKING_DATA.forEach(function (booking) {
    const el = document.createElement('div');
    el.className = 'booking-item';
    const iconName = typeIcons[booking.type] || 'calendar';
    const color = colorMap[booking.color] || '#3B82F6';
    const subtitle = booking.room || booking.details || '';

    el.innerHTML =
      '<div class="booking-item__indicator" style="background:' + color + '"></div>' +
      '<div class="booking-item__icon" style="color:' + color + '">' + getIcon(iconName, 18) + '</div>' +
      '<div class="booking-item__content">' +
        '<h4 class="booking-item__title">' + booking.title + '</h4>' +
        '<p class="booking-item__subtitle">' + subtitle + '</p>' +
      '</div>' +
      '<span class="booking-item__time">' + booking.time + '</span>';

    bookingsContainer.appendChild(el);
  });
}


/* --------------------------------------------------------------------------
   12. renderReturnsTable()
   -------------------------------------------------------------------------- */
function renderReturnsTable() {
  const tbody = document.querySelector('.data-table tbody, .returns-table tbody, [data-bind="returnsTableBody"]');
  if (!tbody) return;

  tbody.innerHTML = '';

  RETURNS_TABLE_DATA.forEach(function (row) {
    const tr = document.createElement('tr');

    /* Row styling based on urgency */
    if (row.daysLeft < 0) {
      tr.className = 'table-row--danger';
    } else if (row.daysLeft <= 2) {
      tr.className = 'table-row--warning';
    }

    /* Days-left display */
    let daysLeftDisplay, daysLeftClass;
    if (row.daysLeft < 0) {
      daysLeftDisplay = 'Overdue';
      daysLeftClass = 'text-danger';
    } else if (row.daysLeft === 0) {
      daysLeftDisplay = 'Due Today';
      daysLeftClass = 'text-warning';
    } else {
      daysLeftDisplay = row.daysLeft + ' days';
      daysLeftClass = row.daysLeft <= 2 ? 'text-warning' : 'text-success';
    }

    /* Priority badge */
    const priorityLabels = { critical: 'Urgent', warning: 'Soon', normal: 'Normal' };
    const priorityColors = { critical: 'danger', warning: 'warning', normal: 'success' };

    tr.innerHTML =
      '<td>' +
        '<div class="asset-cell">' +
          '<span class="asset-cell__name">' + row.asset + '</span>' +
          '<span class="asset-cell__id">' + row.assetId + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' + row.employee + '</td>' +
      '<td><span class="badge badge--outline">' + row.department + '</span></td>' +
      '<td>' + formatDate(row.returnDate) + '</td>' +
      '<td><span class="' + daysLeftClass + ' font-semibold">' + daysLeftDisplay + '</span></td>' +
      '<td><span class="badge badge--' + (priorityColors[row.priority] || 'default') + '">' +
        (priorityLabels[row.priority] || row.priority) + '</span></td>' +
      '<td>' +
        '<div class="table-actions">' +
          '<button class="btn btn--icon btn--ghost" data-tooltip="View Details" data-action="view" data-asset="' + row.assetId + '">' +
            getIcon('eye', 16) +
          '</button>' +
          '<button class="btn btn--icon btn--ghost" data-tooltip="Send Reminder" data-action="remind" data-asset="' + row.assetId + '">' +
            getIcon('bell', 16) +
          '</button>' +
          '<button class="btn btn--icon btn--ghost" data-tooltip="More" data-action="more" data-asset="' + row.assetId + '">' +
            getIcon('more-horizontal', 16) +
          '</button>' +
        '</div>' +
      '</td>';

    /* Action button handlers */
    tr.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const action = btn.dataset.action;
        const asset = btn.dataset.asset;
        alert('Action: ' + action + ' for asset ' + asset);
      });
    });

    tbody.appendChild(tr);
  });
}


/* --------------------------------------------------------------------------
   13. initUtilizationChart() — Chart.js Line / Area
   -------------------------------------------------------------------------- */
function initUtilizationChart() {
  const canvas = document.getElementById('utilizationChart');
  if (!canvas) return;

  if (chartInstances.utilization) {
    chartInstances.utilization.destroy();
  }

  const ctx = canvas.getContext('2d');

  /* Create gradient for the "Utilized" dataset fill */
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement ? canvas.parentElement.clientHeight : 300);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

  chartInstances.utilization = new Chart(canvas, {
    type: 'line',
    data: {
      labels: UTILIZATION_DATA.labels,
      datasets: [
        {
          label: 'Utilized',
          data: UTILIZATION_DATA.utilized,
          borderColor: '#3B82F6',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Idle',
          data: UTILIZATION_DATA.idle,
          borderColor: '#94A3B8',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          borderDash: [],
          pointBackgroundColor: '#94A3B8',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Benchmark (80%)',
          data: UTILIZATION_DATA.benchmark,
          borderColor: '#EF4444',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0,
          borderWidth: 1.5,
          borderDash: [8, 4],
          pointRadius: 0,
          pointHoverRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: false
          },
          ticks: {
            callback: function (value) { return value + '%'; },
            font: { family: '"Inter", sans-serif', size: 11 },
            color: '#94A3B8',
            stepSize: 20
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: '"Inter", sans-serif', size: 12, weight: '500' },
            color: '#475569'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: { family: '"Inter", sans-serif', size: 11, weight: '500' },
            color: '#475569'
          }
        },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: '"Inter", sans-serif', size: 13, weight: '600' },
          bodyFont: { family: '"Inter", sans-serif', size: 12 },
          padding: 14,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            label: function (ctx) {
              return ' ' + ctx.dataset.label + ': ' + ctx.parsed.y + '%';
            }
          }
        }
      },
      animation: {
        duration: 1200,
        easing: 'easeOutCubic'
      }
    }
  });
}


/* --------------------------------------------------------------------------
   14. renderAuditStatus()
   -------------------------------------------------------------------------- */
function renderAuditStatus() {
  const container = document.querySelector('#auditSection, .audit-section, .audit-status, [data-bind="auditStatus"]');
  if (!container) return;

  const pct = AUDIT_DATA.completionPercent;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  container.innerHTML =
    '<div class="audit-status__header">' +
      '<h3 class="audit-status__cycle">' + AUDIT_DATA.currentCycle + '</h3>' +
    '</div>' +
    '<div class="audit-status__body">' +
      /* SVG Progress Ring */
      '<div class="audit-status__ring">' +
        '<svg width="140" height="140" viewBox="0 0 140 140">' +
          '<circle cx="70" cy="70" r="' + radius + '" fill="none" stroke="#E2E8F0" stroke-width="10"/>' +
          '<circle class="audit-ring-progress" cx="70" cy="70" r="' + radius + '" fill="none" ' +
            'stroke="#3B82F6" stroke-width="10" stroke-linecap="round" ' +
            'stroke-dasharray="' + circumference + '" ' +
            'stroke-dashoffset="' + circumference + '" ' +
            'transform="rotate(-90 70 70)" ' +
            'style="transition: stroke-dashoffset 1.5s ease-out"/>' +
          '<text x="70" y="65" text-anchor="middle" font-size="28" font-weight="700" fill="#1E293B" font-family="Inter, sans-serif">' + pct + '%</text>' +
          '<text x="70" y="84" text-anchor="middle" font-size="11" fill="#64748B" font-family="Inter, sans-serif">Complete</text>' +
        '</svg>' +
      '</div>' +
      /* Summary Stats */
      '<div class="audit-status__stats">' +
        '<div class="audit-stat">' +
          '<span class="audit-stat__icon" style="color:#3B82F6">' + getIcon('check-circle', 18) + '</span>' +
          '<div><span class="audit-stat__value">' + formatNumber(AUDIT_DATA.assetsVerified) + '</span>' +
          '<span class="audit-stat__label">Verified</span></div>' +
        '</div>' +
        '<div class="audit-stat">' +
          '<span class="audit-stat__icon" style="color:#94A3B8">' + getIcon('box', 18) + '</span>' +
          '<div><span class="audit-stat__value">' + formatNumber(AUDIT_DATA.totalAssets) + '</span>' +
          '<span class="audit-stat__label">Total Assets</span></div>' +
        '</div>' +
        '<div class="audit-stat">' +
          '<span class="audit-stat__icon" style="color:#EF4444">' + getIcon('search', 18) + '</span>' +
          '<div><span class="audit-stat__value">' + AUDIT_DATA.missing + '</span>' +
          '<span class="audit-stat__label">Missing</span></div>' +
        '</div>' +
        '<div class="audit-stat">' +
          '<span class="audit-stat__icon" style="color:#F59E0B">' + getIcon('alert-triangle', 18) + '</span>' +
          '<div><span class="audit-stat__value">' + AUDIT_DATA.damaged + '</span>' +
          '<span class="audit-stat__label">Damaged</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Animate ring: set the final offset after a short delay so the CSS transition plays */
  requestAnimationFrame(function () {
    setTimeout(function () {
      const ring = container.querySelector('.audit-ring-progress');
      if (ring) {
        ring.style.strokeDashoffset = offset;
      }
    }, 300);
  });
}


/* --------------------------------------------------------------------------
   15. renderNotificationCenter()
   -------------------------------------------------------------------------- */
function renderNotificationCenter() {
  const container = document.querySelector('.notification-feed, [data-bind="notificationFeed"]');
  if (!container) return;

  /* Notification state (clone to allow mutations) */
  const notifications = NOTIFICATIONS_DATA.map(function (n) { return Object.assign({}, n); });

  function markAllRead() {
    notifications.forEach(function (n) { n.unread = false; });
    renderList();
  }

  function renderList() {
    container.innerHTML = '';

    /* "Mark All Read" button */
    const unreadCount = notifications.filter(function (n) { return n.unread; }).length;

    const header = document.createElement('div');
    header.className = 'notification-feed__header';
    header.innerHTML =
      '<span class="notification-feed__count">' + unreadCount + ' unread</span>' +
      '<button class="btn btn--sm btn--ghost notification-feed__mark-all" ' +
        (unreadCount === 0 ? 'disabled' : '') + '>Mark All Read</button>';

    header.querySelector('.notification-feed__mark-all').addEventListener('click', markAllRead);

    container.appendChild(header);

    /* Individual notifications */
    notifications.forEach(function (notif, index) {
      const el = document.createElement('div');
      el.className = 'notification-item' + (notif.unread ? ' notification-item--unread' : '');

      el.innerHTML =
        '<div class="notification-item__icon">' + getIcon(notif.icon, 18) + '</div>' +
        '<div class="notification-item__body">' +
          '<div class="notification-item__header">' +
            '<h4 class="notification-item__title">' + notif.title + '</h4>' +
            '<span class="notification-item__time">' + getRelativeTime(notif.time) + '</span>' +
          '</div>' +
          '<p class="notification-item__text">' + notif.text + '</p>' +
          (notif.unread
            ? '<button class="btn btn--xs btn--ghost notification-item__read" data-index="' + index + '">Mark as Read</button>'
            : '') +
        '</div>';

      /* Mark individual as read */
      const readBtn = el.querySelector('.notification-item__read');
      if (readBtn) {
        readBtn.addEventListener('click', function () {
          notifications[index].unread = false;
          renderList();
        });
      }

      container.appendChild(el);
    });
  }

  renderList();

  /* Wire up header "Mark All Read" button in widget actions */
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllRead);
  }
}


/* --------------------------------------------------------------------------
   16. initFAB() — Floating Action Button
   -------------------------------------------------------------------------- */
function initFAB() {
  const fab = document.querySelector('.fab-trigger, .fab-btn, [data-action="fab"]');
  const fabMenu = document.querySelector('.fab-menu');

  if (!fab) return;

  let isOpen = false;

  function toggleFAB() {
    isOpen = !isOpen;

    if (fabMenu) {
      fabMenu.classList.toggle('open', isOpen);
    }

    /* Rotate the + icon 45° when open (becomes an ×) */
    fab.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)';
    fab.style.transition = 'transform 0.25s ease';
  }

  function closeFAB() {
    if (!isOpen) return;
    isOpen = false;
    if (fabMenu) fabMenu.classList.remove('open');
    fab.style.transform = 'rotate(0deg)';
  }

  fab.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleFAB();
  });

  /* Close on outside click */
  document.addEventListener('click', function (e) {
    if (isOpen && fabMenu && !fabMenu.contains(e.target) && e.target !== fab) {
      closeFAB();
    }
  });

  /* Menu item clicks */
  if (fabMenu) {
    fabMenu.querySelectorAll('[data-fab-action], .fab-menu-item, button, a').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        const action = item.dataset.fabAction || item.textContent.trim();
        alert('FAB Action: ' + action);
        closeFAB();
      });
    });
  }

  /* Expose closeFAB globally for keyboard shortcut usage */
  window._closeFAB = closeFAB;
}


/* --------------------------------------------------------------------------
   17. initAnimations() — Intersection Observer scroll-triggered animations
   -------------------------------------------------------------------------- */
function initAnimations() {
  /* Skip if IntersectionObserver is not available (very old browsers) */
  if (!('IntersectionObserver' in window)) return;

  const animatedElements = document.querySelectorAll(
    '.widget, .kpi-card, .chart-widget, .alert-item, .timeline-item, ' +
    '.booking-item, .notification-item, .audit-status, .maintenance-status-card, ' +
    '[data-animate]'
  );

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, index) {
      if (entry.isIntersecting) {
        /* Stagger the animation delay based on index within its batch */
        const delay = (index % 6) * 80;
        entry.target.style.transitionDelay = delay + 'ms';
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target); /* Animate only once */
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  animatedElements.forEach(function (el) {
    observer.observe(el);
  });
}


/* --------------------------------------------------------------------------
   18. initSearch() — Global search functionality
   -------------------------------------------------------------------------- */
function initSearch() {
  const searchInput = document.querySelector('.search-bar input, .header-search input, #globalSearch');
  if (!searchInput) return;

  searchInput.addEventListener('keyup', function (e) {
    const query = searchInput.value.trim();

    /* Execute search on Enter key */
    if (e.key === 'Enter' && query.length > 0) {
      alert('Searching AssetFlow for: "' + query + '"\n\nResults would include matching assets, employees, bookings, and maintenance tickets.');
      return;
    }

    /* Live suggestion dropdown (lightweight implementation) */
    let dropdown = document.querySelector('.search-suggestions');

    if (query.length >= 2) {
      /* Generate simple suggestions from available data */
      const suggestions = generateSearchSuggestions(query);

      if (suggestions.length > 0) {
        if (!dropdown) {
          dropdown = document.createElement('div');
          dropdown.className = 'search-suggestions';
          searchInput.parentElement.style.position = 'relative';
          searchInput.parentElement.appendChild(dropdown);
        }

        dropdown.innerHTML = suggestions.map(function (s) {
          return '<div class="search-suggestion-item" data-value="' + s.text + '">' +
            '<span class="search-suggestion-icon">' + getIcon(s.icon, 14) + '</span>' +
            '<span>' + s.text + '</span>' +
            '<span class="search-suggestion-type">' + s.type + '</span>' +
          '</div>';
        }).join('');

        dropdown.style.display = 'block';

        dropdown.querySelectorAll('.search-suggestion-item').forEach(function (item) {
          item.addEventListener('click', function () {
            searchInput.value = item.dataset.value;
            dropdown.style.display = 'none';
            alert('Selected: ' + item.dataset.value);
          });
        });
      }
    } else if (dropdown) {
      dropdown.style.display = 'none';
    }
  });

  /* Close suggestions on outside click */
  document.addEventListener('click', function (e) {
    const dropdown = document.querySelector('.search-suggestions');
    if (dropdown && !searchInput.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

/**
 * Generate search suggestions by scanning known data sources for partial matches.
 */
function generateSearchSuggestions(query) {
  const q = query.toLowerCase();
  const results = [];

  /* Search assets in returns table */
  RETURNS_TABLE_DATA.forEach(function (row) {
    if (row.asset.toLowerCase().includes(q) || row.assetId.toLowerCase().includes(q)) {
      results.push({ text: row.asset + ' (' + row.assetId + ')', type: 'Asset', icon: 'box' });
    }
    if (row.employee.toLowerCase().includes(q)) {
      results.push({ text: row.employee + ' — ' + row.department, type: 'Employee', icon: 'user' });
    }
  });

  /* Search bookings */
  BOOKING_DATA.forEach(function (b) {
    if (b.title.toLowerCase().includes(q) || (b.room && b.room.toLowerCase().includes(q))) {
      results.push({ text: b.title, type: 'Booking', icon: 'calendar' });
    }
  });

  /* Search departments */
  DEPARTMENT_DATA.departments.forEach(function (dept) {
    if (dept.toLowerCase().includes(q)) {
      results.push({ text: dept + ' Department', type: 'Department', icon: 'building' });
    }
  });

  /* Deduplicate and limit */
  const seen = new Set();
  return results.filter(function (r) {
    if (seen.has(r.text)) return false;
    seen.add(r.text);
    return true;
  }).slice(0, 6);
}


/* --------------------------------------------------------------------------
   19. initTooltips() — CSS tooltip enhancement
   -------------------------------------------------------------------------- */
function initTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach(function (el) {
    /* Ensure the element has relative positioning for CSS tooltip to anchor */
    const position = window.getComputedStyle(el).position;
    if (position === 'static') {
      el.style.position = 'relative';
    }

    /* Create a tooltip element that CSS can style */
    el.addEventListener('mouseenter', function () {
      /* Remove any existing tooltip */
      const existing = el.querySelector('.js-tooltip');
      if (existing) existing.remove();

      const tip = document.createElement('span');
      tip.className = 'js-tooltip';
      tip.textContent = el.dataset.tooltip;
      tip.style.cssText =
        'position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);' +
        'background:#1E293B;color:#fff;font-size:11px;padding:4px 10px;border-radius:6px;' +
        'white-space:nowrap;pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.15s ease;' +
        'font-family:"Inter",sans-serif;font-weight:500;';

      el.appendChild(tip);

      requestAnimationFrame(function () {
        tip.style.opacity = '1';
      });
    });

    el.addEventListener('mouseleave', function () {
      const tip = el.querySelector('.js-tooltip');
      if (tip) {
        tip.style.opacity = '0';
        setTimeout(function () { tip.remove(); }, 150);
      }
    });
  });
}


/* --------------------------------------------------------------------------
   20. initKeyboardShortcuts()
   -------------------------------------------------------------------------- */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
    /* Ctrl+K or Cmd+K — Focus search bar */
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const search = document.querySelector('.search-bar input, .header-search input, #globalSearch');
      if (search) {
        search.focus();
        search.select();
      }
    }

    /* Escape — Close FAB menu, dropdowns, modals */
    if (e.key === 'Escape') {
      /* Close FAB */
      if (typeof window._closeFAB === 'function') {
        window._closeFAB();
      }

      /* Close notification dropdown */
      const notifDropdown = document.querySelector('.notification-dropdown.open, .notif-dropdown.open');
      if (notifDropdown) {
        notifDropdown.classList.remove('open');
      }

      /* Close search suggestions */
      const suggestions = document.querySelector('.search-suggestions');
      if (suggestions) {
        suggestions.style.display = 'none';
      }

      /* Blur active element */
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }

    /* ? key — Show keyboard shortcuts help (only when not typing in input) */
    if (e.key === '?' && !isTypingInInput()) {
      e.preventDefault();
      alert(
        'AssetFlow Keyboard Shortcuts\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        'Ctrl + K      Focus search bar\n' +
        'Escape        Close menus & dropdowns\n' +
        '?             Show this help dialog\n\n' +
        'Navigation shortcuts coming in v3.3'
      );
    }
  });
}

/**
 * Returns true if the user is currently typing in an input/textarea/select.
 * Used to prevent keyboard shortcuts from firing while typing.
 */
function isTypingInInput() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}


/* ============================================================================
   END OF FILE — AssetFlow Dashboard v3.2
   ============================================================================ */

/* --------------------------------------------------------------------------
   NEW VIEW RENDER FUNCTIONS
   -------------------------------------------------------------------------- */

const ASSETS_LIST = [
  { name: 'MacBook Pro 16"', id: 'AF-156', category: 'Laptop', status: 'Allocated', statusColor: 'primary', assignedTo: 'Vikram Singh', location: 'HQ - Floor 3' },
  { name: 'Laptop - Dell XPS 15', id: 'AF-014', category: 'Laptop', status: 'Allocated', statusColor: 'primary', assignedTo: 'Rahul Sharma', location: 'Remote - Bangalore' },
  { name: 'Monitor - Dell UltraSharp', id: 'MN-032', category: 'Peripheral', status: 'Under Maintenance', statusColor: 'warning', assignedTo: 'IT Dept', location: 'IT Store' },
  { name: 'Toyota Innova', id: 'V-008', category: 'Vehicle', status: 'Available', statusColor: 'success', assignedTo: 'N/A', location: 'Basement Parking' },
  { name: 'Projector - Epson EB', id: 'PJ-003', category: 'Equipment', status: 'Reserved', statusColor: 'purple', assignedTo: 'Meera Reddy', location: 'Meeting Room 2' }
];

function renderAssetsView() {
  const tbody = document.getElementById('assetsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  ASSETS_LIST.forEach(function(asset) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><div class="asset-cell"><span class="asset-cell__name">' + asset.name + '</span><span class="asset-cell__id">' + asset.id + '</span></div></td>' +
      '<td>' + asset.category + '</td>' +
      '<td><span class="badge badge--' + asset.statusColor + '">' + asset.status + '</span></td>' +
      '<td>' + asset.assignedTo + '</td>' +
      '<td>' + asset.location + '</td>' +
      '<td>' +
        '<div class="table-actions">' +
          '<button class="btn btn--icon btn--ghost tooltip" data-tooltip="View Details" onclick="openAssetDetails(\'' + asset.id + '\')">' + getIcon('eye', 16) + '</button>' +
          '<button class="btn btn--icon btn--ghost tooltip" data-tooltip="Edit">' + getIcon('settings', 16) + '</button>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

const EMPLOYEES_LIST = [
  { name: 'Sarah Khan', role: 'Admin', department: 'IT', assets: 3 },
  { name: 'Rahul Sharma', role: 'Software Engineer', department: 'Engineering', assets: 2 },
  { name: 'Meera Reddy', role: 'HR Manager', department: 'HR', assets: 1 },
  { name: 'Vikram Singh', role: 'Engineering Lead', department: 'IT', assets: 4 },
  { name: 'Amit Kumar', role: 'Operations Agent', department: 'Operations', assets: 2 }
];

function renderEmployeesView() {
  const tbody = document.getElementById('employeesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  EMPLOYEES_LIST.forEach(function(emp) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' +
        '<div style="display:flex; align-items:center; gap: 12px;">' +
          '<div style="width:32px;height:32px;border-radius:50%;background:#E2E8F0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:#475569;">' + emp.name.charAt(0) + '</div>' +
          '<span style="font-weight: 500; color: #1E293B;">' + emp.name + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' + emp.role + '</td>' +
      '<td><span class="badge badge--outline">' + emp.department + '</span></td>' +
      '<td>' + emp.assets + ' assets</td>' +
      '<td><button class="btn btn--sm btn--outline">Manage</button></td>';
    tbody.appendChild(tr);
  });
}

function renderBookingsViewPage() {
  const container = document.getElementById('bookingsViewList');
  if (!container || container.children.length > 0) return; // Prevent re-render duplicate
  const typeIcons = { meeting: 'users', vehicle: 'truck', room: 'building' };
  const colorMap = { primary: '#3B82F6', accent: '#F59E0B', purple: '#8B5CF6' };
  BOOKING_DATA.forEach(function (booking) {
    const el = document.createElement('div');
    el.className = 'booking-item';
    const iconName = typeIcons[booking.type] || 'calendar';
    const color = colorMap[booking.color] || '#3B82F6';
    el.innerHTML =
      '<div class="booking-item__indicator" style="background:' + color + '"></div>' +
      '<div class="booking-item__icon" style="color:' + color + '">' + getIcon(iconName, 18) + '</div>' +
      '<div class="booking-item__content">' +
        '<h4 class="booking-item__title">' + booking.title + '</h4>' +
        '<p class="booking-item__subtitle">' + (booking.room || booking.details || '') + '</p>' +
      '</div>' +
      '<span class="booking-item__time">' + booking.time + '</span>';
    container.appendChild(el);
  });
}

function renderFullNotificationFeed() {
  const container = document.getElementById('fullNotificationFeed');
  if (!container || container.children.length > 0) return; // Prevent duplicate
  NOTIFICATIONS_DATA.forEach(function (notif) {
    const el = document.createElement('div');
    el.className = 'notification-item' + (notif.unread ? ' notification-item--unread' : '');
    el.innerHTML =
      '<div class="notification-item__icon">' + getIcon(notif.icon, 18) + '</div>' +
      '<div class="notification-item__body">' +
        '<div class="notification-item__header">' +
          '<h4 class="notification-item__title">' + notif.title + '</h4>' +
          '<span class="notification-item__time">' + getRelativeTime(notif.time) + '</span>' +
        '</div>' +
        '<p class="notification-item__text">' + notif.text + '</p>' +
      '</div>';
    container.appendChild(el);
  });
}

const ALLOCATIONS_LIST = [
  { id: 'ALC-001', asset: 'Laptop - Dell XPS 15', assignee: 'Rahul Sharma', date: '2026-06-15', status: 'Active' },
  { id: 'ALC-002', asset: 'Monitor - Dell UltraSharp', assignee: 'IT Dept', date: '2026-06-20', status: 'Pending Transfer' },
  { id: 'ALC-003', asset: 'Toyota Innova', assignee: 'Operations', date: '2026-07-01', status: 'Active' }
];

function renderAllocationsView() {
  const container = document.getElementById('allocationsViewList');
  if (!container) return;
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'data-table';
  table.innerHTML = '<thead><tr><th>Allocation ID</th><th>Asset</th><th>Assignee</th><th>Date</th><th>Status</th></tr></thead><tbody id="allocationsTableBody"></tbody>';
  container.appendChild(table);
  const tbody = document.getElementById('allocationsTableBody');
  ALLOCATIONS_LIST.forEach(function(alc) {
    const tr = document.createElement('tr');
    const badgeColor = alc.status === 'Active' ? 'success' : 'warning';
    tr.innerHTML =
      '<td><span class="font-semibold">' + alc.id + '</span></td>' +
      '<td>' + alc.asset + '</td>' +
      '<td>' + alc.assignee + '</td>' +
      '<td>' + alc.date + '</td>' +
      '<td><span class="badge badge--' + badgeColor + '">' + alc.status + '</span></td>';
    tbody.appendChild(tr);
  });
}

function renderDepartmentsView() {
  const container = document.getElementById('departmentsGrid');
  if (!container || container.children.length > 0) return;
  DEPARTMENT_DATA.departments.forEach(function(dept, i) {
    const card = document.createElement('div');
    card.className = 'widget';
    card.style.padding = '20px';
    card.innerHTML = 
      '<h3 class="widget-title" style="margin-bottom: 12px;">' + dept + '</h3>' +
      '<div style="display:flex; justify-content:space-between; margin-bottom: 8px;"><span style="color:#64748B;">Allocated Assets:</span><span class="font-semibold">' + DEPARTMENT_DATA.allocated[i] + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; margin-bottom: 8px;"><span style="color:#64748B;">Available Assets:</span><span class="font-semibold">' + DEPARTMENT_DATA.available[i] + '</span></div>' +
      '<div style="display:flex; justify-content:space-between;"><span style="color:#64748B;">In Maintenance:</span><span class="font-semibold text-warning">' + DEPARTMENT_DATA.maintenance[i] + '</span></div>';
    container.appendChild(card);
  });
}

function renderReportsView() {
  const container = document.getElementById('reportsGrid');
  if (!container || container.children.length > 0) return;
  const reports = [
    { title: 'Asset Valuation Report', icon: 'file-text', color: '#10B981' },
    { title: 'Asset Utilization', icon: 'bar-chart-2', color: '#3B82F6' },
    { title: 'Maintenance Logs', icon: 'tool', color: '#F59E0B' },
    { title: 'Financial Depreciation', icon: 'trending-down', color: '#EF4444' },
    { title: 'Employee Allocations', icon: 'users', color: '#8B5CF6' }
  ];
  reports.forEach(function(report) {
    const btn = document.createElement('button');
    btn.className = 'quick-action-btn';
    btn.innerHTML =
      '<span class="quick-action-btn__icon" style="color:' + report.color + '">' + getIcon(report.icon) + '</span>' +
      '<span class="quick-action-btn__label">' + report.title + '</span>';
    btn.addEventListener('click', () => alert('Generating ' + report.title + '...'));
    container.appendChild(btn);
  });
}

/* ============================================================================
   ASSET INTELLIGENCE MODULE
   ============================================================================ */

function initModals() {
  const btnNewAsset = document.getElementById('btnNewAsset');
  const modalReg = document.getElementById('modalRegisterAsset');
  const closeReg = document.getElementById('closeRegisterAsset');
  const cancelReg = document.getElementById('cancelRegisterAsset');

  if (btnNewAsset && modalReg) {
    btnNewAsset.addEventListener('click', () => {
      modalReg.classList.add('open');
      // Trigger initial calculation
      document.getElementById('regPurchaseCost').dispatchEvent(new Event('input'));
    });
  }
  
  if (closeReg) closeReg.addEventListener('click', () => modalReg.classList.remove('open'));
  if (cancelReg) cancelReg.addEventListener('click', () => modalReg.classList.remove('open'));

  // Hook into FAB menu
  const fabItems = document.querySelectorAll('.fab-menu-item');
  fabItems.forEach(item => {
    if (item.dataset.fabAction === 'Register Asset') {
      item.addEventListener('click', () => {
        if (modalReg) {
          modalReg.classList.add('open');
          document.getElementById('regPurchaseCost').dispatchEvent(new Event('input'));
        }
      });
    }
  });

  const modalDetails = document.getElementById('modalAssetDetails');
  const closeDetails = document.getElementById('closeAssetDetails');
  if (closeDetails && modalDetails) {
    closeDetails.addEventListener('click', () => {
      modalDetails.classList.remove('open');
    });
  }
}

function initDepreciationCalculator() {
  // Modal calculation
  const modalTriggers = document.querySelectorAll('.calc-trigger');
  
  function calculateModal() {
    const cost = parseFloat(document.getElementById('regPurchaseCost').value) || 0;
    const salvage = parseFloat(document.getElementById('regSalvageValue').value) || 0;
    const usefulLife = parseFloat(document.getElementById('regUsefulLife').value) || 1;
    const acqDateStr = document.getElementById('regAcqDate').value;
    
    // Straight Line Math
    const annualDep = (cost - salvage) / usefulLife;
    
    // Calculate Age
    let ageYears = 0;
    let retDate = '-';
    if (acqDateStr) {
      const acqDate = new Date(acqDateStr);
      const now = new Date();
      const diffTime = Math.abs(now - acqDate);
      ageYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      
      const rDate = new Date(acqDate);
      rDate.setFullYear(rDate.getFullYear() + usefulLife);
      retDate = rDate.toLocaleDateString();
    }
    
    let yearsUsed = Math.min(ageYears, usefulLife);
    let currentBookValue = cost - (annualDep * yearsUsed);
    currentBookValue = Math.max(currentBookValue, salvage);
    
    let totalDep = cost - currentBookValue;
    let depPercent = cost > 0 ? (totalDep / cost) * 100 : 0;
    
    let remLife = Math.max(0, usefulLife - ageYears);
    
    // Format and Update DOM
    document.getElementById('calcBookValue').textContent = '$' + formatNumber(currentBookValue.toFixed(2));
    document.getElementById('calcTotalDep').textContent = '$' + formatNumber(totalDep.toFixed(2));
    document.getElementById('calcDepPercent').textContent = depPercent.toFixed(1) + '%';
    document.getElementById('calcAnnualDep').textContent = '$' + formatNumber(annualDep.toFixed(2));
    document.getElementById('calcRemLife').textContent = remLife.toFixed(1) + ' Yrs';
    document.getElementById('calcRetDate').textContent = retDate;
  }
  
  modalTriggers.forEach(t => t.addEventListener('input', calculateModal));

  // Dedicated Page calculation
  const pageTriggers = document.querySelectorAll('.calc-trigger-page');
  let pageDepChartInstance = null;
  
  function calculatePage() {
    const cost = parseFloat(document.getElementById('pagePurchaseCost').value) || 0;
    const salvage = parseFloat(document.getElementById('pageSalvageValue').value) || 0;
    const usefulLife = parseFloat(document.getElementById('pageUsefulLife').value) || 1;
    const acqDateStr = document.getElementById('pageAcqDate').value;
    
    // Straight Line Math
    const annualDep = (cost - salvage) / usefulLife;
    
    // Calculate Age
    let ageYears = 0;
    let retDate = '-';
    if (acqDateStr) {
      const acqDate = new Date(acqDateStr);
      const now = new Date();
      const diffTime = Math.abs(now - acqDate);
      ageYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      
      const rDate = new Date(acqDate);
      rDate.setFullYear(rDate.getFullYear() + usefulLife);
      retDate = rDate.toLocaleDateString();
    }
    
    let yearsUsed = Math.min(ageYears, usefulLife);
    let currentBookValue = cost - (annualDep * yearsUsed);
    currentBookValue = Math.max(currentBookValue, salvage);
    
    let totalDep = cost - currentBookValue;
    let depPercent = cost > 0 ? (totalDep / cost) * 100 : 0;
    
    let remLife = Math.max(0, usefulLife - ageYears);
    
    // Format and Update DOM
    document.getElementById('pageBookValue').textContent = '$' + formatNumber(currentBookValue.toFixed(2));
    document.getElementById('pageTotalDep').textContent = '$' + formatNumber(totalDep.toFixed(2));
    document.getElementById('pageDepPercent').textContent = depPercent.toFixed(1) + '%';
    document.getElementById('pageAnnualDep').textContent = '$' + formatNumber(annualDep.toFixed(2));
    document.getElementById('pageRemLife').textContent = remLife.toFixed(1) + ' Yrs';
    document.getElementById('pageRetDate').textContent = retDate;
    
    // Update Chart
    const labels = [];
    const dataBookValue = [];
    const startYear = new Date(acqDateStr || new Date()).getFullYear();
    
    const chartLife = Math.max(1, Math.ceil(usefulLife));
    for (let i = 0; i <= chartLife; i++) {
      labels.push((startYear + i).toString());
      let val = cost - (annualDep * i);
      dataBookValue.push(Math.max(val, salvage));
    }
    
    const ctx = document.getElementById('pageDepForecastChart');
    if (ctx && typeof Chart !== 'undefined') {
      if (pageDepChartInstance) {
        pageDepChartInstance.data.labels = labels;
        pageDepChartInstance.data.datasets[0].data = dataBookValue;
        pageDepChartInstance.update();
      } else {
        const style = getComputedStyle(document.body);
        const primary = style.getPropertyValue('--color-primary').trim() || '#3B82F6';
        
        pageDepChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Book Value ($)',
              data: dataBookValue,
              borderColor: primary,
              borderWidth: 3,
              tension: 0.1,
              fill: true,
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, border: { display: false } },
              x: { border: { display: false } }
            }
          }
        });
      }
    }
  }
  
  pageTriggers.forEach(t => t.addEventListener('input', calculatePage));
  
  // Trigger initial calculation for the page view if elements exist
  if (document.getElementById('pagePurchaseCost')) {
    setTimeout(calculatePage, 200); // slight delay to ensure chart gets valid dimensions
  }
}

window.openAssetDetails = function(assetId) {
  // Mock data fetching based on ID
  const asset = ASSETS_LIST.find(a => a.id === assetId) || ASSETS_LIST[0];
  
  document.getElementById('detAssetName').textContent = asset.name;
  document.getElementById('detAssetStatus').textContent = asset.status;
  document.getElementById('detAssetStatus').className = 'badge badge--' + asset.statusColor;
  
  // Randomize math for demo purposes based on ID
  const seed = asset.name.length;
  const cost = 1200 + (seed * 200);
  const age = (seed % 4) + 1.5;
  const life = 5;
  const depPercent = Math.min((age / life) * 100, 100);
  const bookValue = cost - (cost * (depPercent/100));
  const healthScore = Math.round(100 - (depPercent * 0.6) - ((seed % 3)*5));
  
  document.getElementById('detPurchaseCost').textContent = '$' + formatNumber(cost);
  document.getElementById('detBookValue').textContent = '$' + formatNumber(bookValue.toFixed(0));
  document.getElementById('detDepPercent').textContent = depPercent.toFixed(1) + '%';
  document.getElementById('detAnnualDep').textContent = '$' + formatNumber((cost/life).toFixed(0));
  document.getElementById('detRemValue').textContent = '$' + formatNumber(bookValue.toFixed(0));
  
  document.getElementById('detAge').textContent = age.toFixed(1) + ' Yrs';
  document.getElementById('detUsefulLife').textContent = life + ' Yrs';
  document.getElementById('detRemLife').textContent = Math.max(0, life - age).toFixed(1) + ' Yrs';
  
  document.getElementById('detHealthScore').textContent = healthScore;
  const ring = document.getElementById('detHealthRing');
  ring.style.strokeDasharray = `${healthScore}, 100`;
  
  let hStatus = 'Excellent';
  if(healthScore < 50) hStatus = 'Replacement Recommended';
  else if(healthScore < 70) hStatus = 'Needs Attention';
  else if(healthScore < 90) hStatus = 'Healthy';
  document.getElementById('detHealthStatus').textContent = hStatus;
  
  document.getElementById('detMaintCount').textContent = (seed % 5);
  
  let rec = 'This asset is performing normally.';
  if (healthScore < 50) rec = 'Asset has depreciated significantly. Plan replacement within the next budget cycle.';
  else if (healthScore < 70) rec = 'Maintenance frequency has increased. Monitor performance.';
  document.getElementById('detRecommendation').textContent = rec;
  
  const modal = document.getElementById('modalAssetDetails');
  if (modal) modal.classList.add('open');
}

function initAssetIntelligenceCharts() {
  if (typeof Chart === 'undefined') return;

  const style = getComputedStyle(document.body);
  const primary = style.getPropertyValue('--color-primary').trim() || '#3B82F6';
  const purple = style.getPropertyValue('--color-purple').trim() || '#8B5CF6';
  const warning = style.getPropertyValue('--color-warning').trim() || '#F59E0B';
  const success = style.getPropertyValue('--color-success').trim() || '#10B981';
  const textMuted = style.getPropertyValue('--color-text-muted').trim() || '#64748B';
  const borderCol = style.getPropertyValue('--color-border-light').trim() || '#E2E8F0';

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { border: { display: false }, grid: { color: borderCol, drawTicks: false }, ticks: { color: textMuted, padding: 10 } },
      x: { border: { display: false }, grid: { display: false }, ticks: { color: textMuted, padding: 10 } }
    }
  };

  // 1. Asset Value Distribution
  const ctxValDist = document.getElementById('chartAssetValueDist');
  if (ctxValDist) {
    new Chart(ctxValDist, {
      type: 'bar',
      data: {
        labels: ['IT Equip', 'Vehicles', 'Furniture', 'Machinery', 'Software'],
        datasets: [{
          data: [450000, 320000, 150000, 280000, 200000],
          backgroundColor: [primary, purple, warning, success, '#38BDF8'],
          borderRadius: 4
        }]
      },
      options: commonOptions
    });
  }

  // 2. Department-wise Asset Value
  const ctxDeptVal = document.getElementById('chartDeptAssetValue');
  if (ctxDeptVal) {
    new Chart(ctxDeptVal, {
      type: 'doughnut',
      data: {
        labels: ['Engineering', 'Operations', 'IT', 'HR', 'Finance'],
        datasets: [{
          data: [35, 25, 20, 10, 10],
          backgroundColor: [primary, purple, warning, success, '#F472B6'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  // 3. Depreciation Trend
  const ctxDepTrend = document.getElementById('chartDepTrend');
  if (ctxDepTrend) {
    new Chart(ctxDepTrend, {
      type: 'line',
      data: {
        labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
        datasets: [{
          label: 'Book Value',
          data: [1200, 1050, 900, 750, 600, 450],
          borderColor: primary,
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }]
      },
      options: commonOptions
    });
  }

  // 4. Replacement Forecast
  const ctxReplForecast = document.getElementById('chartReplForecast');
  if (ctxReplForecast) {
    new Chart(ctxReplForecast, {
      type: 'bar',
      data: {
        labels: ['Q3 26', 'Q4 26', 'Q1 27', 'Q2 27', 'Q3 27'],
        datasets: [{
          label: 'Replacements',
          data: [15, 28, 12, 45, 20],
          backgroundColor: purple,
          borderRadius: 4
        }]
      },
      options: commonOptions
    });
  }

  // 5. Asset Health Distribution
  const ctxHealthDist = document.getElementById('chartHealthDist');
  if (ctxHealthDist) {
    new Chart(ctxHealthDist, {
      type: 'pie',
      data: {
        labels: ['Excellent', 'Healthy', 'Needs Attention', 'Replace'],
        datasets: [{
          data: [45, 30, 15, 10],
          backgroundColor: [success, primary, warning, '#EF4444'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  // 6. Maintenance vs Depreciation
  const ctxMaintDep = document.getElementById('chartMaintVsDep');
  if (ctxMaintDep) {
    new Chart(ctxMaintDep, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Assets',
          data: [
            {x: 10, y: 2}, {x: 20, y: 3}, {x: 40, y: 5},
            {x: 60, y: 8}, {x: 80, y: 15}, {x: 90, y: 22}
          ],
          backgroundColor: warning,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Depreciation %' } },
          y: { title: { display: true, text: 'Maintenance Count' } }
        }
      }
    });
  }
}
