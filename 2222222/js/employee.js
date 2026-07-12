'use strict';

/* ============================================================================
   AssetFlow — Employee Portal Logic
   ========================================================================= */

/* --------------------------------------------------------------------------
   MOCK DATA
   -------------------------------------------------------------------------- */
const MY_ASSETS = [
  { id: 'AF-014', name: 'Laptop - Dell XPS 15', tag: 'AF-014', category: 'IT Equipment', department: 'Engineering', status: 'Active', statusColor: 'success', condition: 'Good', assignedDate: '2025-01-15', returnDate: '-', bookValue: '$1,200', healthScore: 85, warranty: '2028-01-15' },
  { id: 'MN-032', name: 'Monitor - Dell UltraSharp', tag: 'MN-032', category: 'IT Equipment', department: 'Engineering', status: 'Active', statusColor: 'success', condition: 'Excellent', assignedDate: '2025-01-15', returnDate: '-', bookValue: '$300', healthScore: 92, warranty: '2028-01-15' },
  { id: 'PH-089', name: 'iPhone 13 Pro', tag: 'PH-089', category: 'Mobile', department: 'Engineering', status: 'Maintenance', statusColor: 'warning', condition: 'Fair', assignedDate: '2024-06-10', returnDate: '2026-06-10', bookValue: '$500', healthScore: 68, warranty: 'Expired' },
  { id: 'TB-021', name: 'iPad Pro 12.9"', tag: 'TB-021', category: 'Tablet', department: 'Engineering', status: 'Return Requested', statusColor: 'primary', condition: 'Good', assignedDate: '2025-11-20', returnDate: '2026-07-20', bookValue: '$800', healthScore: 88, warranty: '2027-11-20' }
];

const MY_UPCOMING_RETURNS = [
  { asset: 'iPad Pro 12.9"', returnDate: '2026-07-20', daysLeft: 8, priority: 'normal' },
  { asset: 'iPhone 13 Pro (Temp)', returnDate: '2026-07-15', daysLeft: 3, priority: 'warning' }
];

const MY_MAINTENANCE = [
  { id: 'MNT-1042', asset: 'iPhone 13 Pro', issue: 'Battery draining fast', priority: 'Medium', status: 'In Progress', date: '2026-07-10', tech: 'IT Support' }
];

const MY_TRANSFERS = [
  { asset: 'Monitor - Dell UltraSharp', to: 'Amit Kumar', reason: 'Project Reassignment', status: 'Pending Approval', date: '2026-07-11' }
];

const MY_ACTIVITY = [
  { time: '10 min ago', status: 'completed', text: 'Booked Conference Room B for 2:00 PM' },
  { time: '2 hours ago', status: 'pending', text: 'Submitted Maintenance Request for iPhone 13 Pro' },
  { time: '1 day ago', status: 'approved', text: 'Transfer request for Monitor approved by Manager' }
];

const MY_NOTIFICATIONS = [
  { title: 'Booking Confirmed', desc: 'Conference Room B booked for 2:00 PM today.', time: '10 min ago', type: 'success' },
  { title: 'Maintenance Update', desc: 'Technician assigned to your request MNT-1042.', time: '1 hour ago', type: 'info' }
];

const AVAILABLE_RESOURCES = [
  { id: 'RM-01', type: 'Meeting Room', name: 'Conference Room A', capacity: 12, building: 'HQ', floor: '1st', status: 'Available' },
  { id: 'RM-02', type: 'Meeting Room', name: 'Board Room', capacity: 20, building: 'HQ', floor: '2nd', status: 'Booked' },
  { id: 'VH-05', type: 'Vehicle', name: 'Toyota Innova (MH-12-AB-1234)', capacity: 7, building: 'HQ Parking', floor: '-', status: 'Available' },
  { id: 'EQ-10', type: 'Equipment', name: 'Projector - Epson', capacity: '-', building: 'HQ', floor: 'IT Desk', status: 'Available' }
];

/* --------------------------------------------------------------------------
   ICONS
   -------------------------------------------------------------------------- */
function getIcon(name, size = 20) {
  const attrs = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const icons = {
    'laptop': `<svg ${attrs}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    'tool': `<svg ${attrs}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    'calendar': `<svg ${attrs}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    'repeat': `<svg ${attrs}><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/><polyline points="8 7 3 12 8 17"/><line x1="3" y1="12" x2="15" y2="12"/></svg>`,
    'rotate-ccw': `<svg ${attrs}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
    'check-circle': `<svg ${attrs}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    'alert-circle': `<svg ${attrs}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    'eye': `<svg ${attrs}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
  };
  return icons[name] || `<svg ${attrs}><circle cx="12" cy="12" r="10"/></svg>`;
}

/* --------------------------------------------------------------------------
   INITIALIZATION
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  renderDashboard();
  renderMyAssets();
  renderBookResources();
});

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const mobileToggle = document.getElementById('mobileSidebarToggle');
  const navItems = document.querySelectorAll('.sidebar .nav-item');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
  }
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const page = item.dataset.page;
      document.querySelectorAll('.page-view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
      });

      const target = document.getElementById('view-' + page);
      if (target) {
        target.style.display = 'block';
        // tiny timeout to allow display block to render before opacity transition
        setTimeout(() => target.classList.add('active'), 10);
      }
      
      if (window.innerWidth < 1024) sidebar.classList.remove('mobile-open');
    });
  });
}

function renderDashboard() {
  // KPIs
  const kpiGrid = document.getElementById('kpiGrid');
  if (kpiGrid) {
    const kpis = [
      { label: 'My Assigned Assets', value: MY_ASSETS.length, icon: 'laptop' },
      { label: 'Pending Requests', value: 2, icon: 'check-circle' },
      { label: 'Active Bookings', value: 1, icon: 'calendar' },
      { label: 'Maintenance Requests', value: 1, icon: 'tool' },
      { label: 'Upcoming Returns', value: MY_UPCOMING_RETURNS.length, icon: 'rotate-ccw' },
      { label: 'Unread Notifications', value: 2, icon: 'alert-circle' }
    ];
    
    kpiGrid.innerHTML = kpis.map(kpi => `
      <div class="kpi-card animate-fade-in-up">
        <div class="kpi-header">
          <span class="kpi-title">${kpi.label}</span>
          <div class="kpi-icon">${getIcon(kpi.icon)}</div>
        </div>
        <div class="kpi-value">${kpi.value}</div>
      </div>
    `).join('');
  }

  // Dashboard My Assets (Mini List)
  const myAssetsList = document.getElementById('dashboardMyAssets');
  if (myAssetsList) {
    myAssetsList.innerHTML = `<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px;">
      ${MY_ASSETS.slice(0,3).map(asset => `
        <li style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid var(--color-border-light);">
          <div>
            <div style="font-weight:600;">${asset.name}</div>
            <div style="font-size:12px; color:var(--color-text-muted);">${asset.tag} • <span class="badge badge--${asset.statusColor}">${asset.status}</span></div>
          </div>
          <button class="btn btn--icon btn--ghost" onclick="openAssetDetails('${asset.id}')">${getIcon('eye', 16)}</button>
        </li>
      `).join('')}
    </ul>`;
  }

  // Upcoming Returns (Rendered into Returns View if you want, but for now we'll just keep the My Assets and Dashboard clean)
  const upRet = document.getElementById('dashboardUpcomingReturns');
  if (upRet) {
    upRet.innerHTML = MY_UPCOMING_RETURNS.map(ret => `
      <tr>
        <td class="font-semibold">${ret.asset}</td>
        <td>${ret.returnDate}</td>
        <td><span class="text-${ret.priority === 'warning' ? 'warning' : 'primary'}">${ret.daysLeft} days</span></td>
        <td><span class="badge badge--${ret.priority}">${ret.priority}</span></td>
        <td><button class="btn btn--secondary btn--sm">Request Ext.</button></td>
      </tr>
    `).join('');
  }
  
  // Maintenance (Rendered into Maintenance View)
  const maint = document.getElementById('maintenanceList');
  if (maint) {
    maint.innerHTML = MY_MAINTENANCE.map(m => `
      <div style="padding:12px; border:1px solid var(--color-border); border-radius:8px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span style="font-weight:600;">${m.asset}</span>
          <span class="badge badge--warning">${m.status}</span>
        </div>
        <div style="font-size:13px; color:var(--color-text-muted); margin-bottom:8px;">Issue: ${m.issue}</div>
        <div style="font-size:12px; color:var(--color-text-muted);">Assigned Tech: ${m.tech}</div>
      </div>
    `).join('');
  }

  // Transfers (Rendered into Transfers View)
  const trans = document.getElementById('transfersList');
  if (trans) {
    trans.innerHTML = MY_TRANSFERS.map(t => `
      <div style="padding:12px; border:1px solid var(--color-border); border-radius:8px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <span style="font-weight:600;">${t.asset}</span>
          <span class="badge badge--primary">${t.status}</span>
        </div>
        <div style="font-size:13px; color:var(--color-text-muted);">To: ${t.to}</div>
      </div>
    `).join('');
  }

  // Activity Timeline (Dashboard)
  const act = document.getElementById('dashboardActivity');
  if (act) {
    act.innerHTML = `<div class="activity-timeline">
      ${MY_ACTIVITY.map(a => `
        <div class="activity-item">
          <div class="activity-dot bg-${a.status === 'completed' ? 'success' : (a.status === 'pending' ? 'warning' : 'primary')}"></div>
          <div class="activity-content">
            <p class="activity-title">${a.text}</p>
            <p class="activity-time">${a.time}</p>
          </div>
        </div>
      `).join('')}
    </div>`;
  }
  
  // Notifications (Rendered in dropdown panel)
  const notifPanel = document.getElementById('notificationPanel');
  if (notifPanel) {
    notifPanel.innerHTML = `<div class="dropdown-header"><h4>Notifications</h4></div>
      <div class="notification-list" style="max-height:300px; overflow-y:auto;">
      ${MY_NOTIFICATIONS.map(n => `
      <div class="notification-item unread" style="padding:12px; border-bottom:1px solid var(--color-border-light);">
        <div style="font-weight:600; margin-bottom:4px; font-size:14px;">${n.title}</div>
        <div style="font-size:13px; color:var(--color-text-muted);">${n.desc}</div>
        <div style="font-size:11px; color:var(--color-text-light); margin-top:4px;">${n.time}</div>
      </div>
    `).join('')}
    </div>`;
  }
}

function renderMyAssets() {
  const grid = document.getElementById('myAssetsGrid');
  if (!grid) return;
  
  grid.innerHTML = MY_ASSETS.map(asset => `
    <div class="widget animate-fade-in-up" style="display:flex; flex-direction:column;">
      <div class="widget-header" style="border-bottom:1px solid var(--color-border-light);">
        <div>
          <h3 class="widget-title">${asset.name}</h3>
          <p class="widget-subtitle">${asset.tag}</p>
        </div>
        <span class="badge badge--${asset.statusColor}">${asset.status}</span>
      </div>
      <div class="widget-body" style="flex:1; display:flex; flex-direction:column; gap:12px; font-size:14px;">
        <div style="display:flex; justify-content:space-between;">
          <span class="text-muted">Category</span>
          <span class="font-medium">${asset.category}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span class="text-muted">Condition</span>
          <span class="font-medium">${asset.condition}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span class="text-muted">Assigned</span>
          <span class="font-medium">${asset.assignedDate}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span class="text-muted">Health Score</span>
          <span class="font-bold text-accent">${asset.healthScore}/100</span>
        </div>
      </div>
      <div style="padding:16px; border-top:1px solid var(--color-border-light); display:flex; gap:8px;">
        <button class="btn btn--primary" style="flex:1;" onclick="openAssetDetails('${asset.id}')">View Details</button>
        <button class="btn btn--secondary tooltip" data-tooltip="Raise Maintenance">${getIcon('tool')}</button>
      </div>
    </div>
  `).join('');
}

window.openAssetDetails = function(assetId) {
  const asset = MY_ASSETS.find(a => a.id === assetId) || MY_ASSETS[0];
  
  document.getElementById('detAssetName').textContent = asset.name;
  document.getElementById('detAssetStatus').textContent = asset.status;
  document.getElementById('detAssetStatus').className = 'badge badge--' + asset.statusColor;
  
  const specsHtml = `
    <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; font-size:14px;">
      <li style="display:flex; justify-content:space-between;"><span class="text-muted">Asset Tag:</span><span class="font-medium">${asset.tag}</span></li>
      <li style="display:flex; justify-content:space-between;"><span class="text-muted">Category:</span><span class="font-medium">${asset.category}</span></li>
      <li style="display:flex; justify-content:space-between;"><span class="text-muted">Department:</span><span class="font-medium">${asset.department}</span></li>
      <li style="display:flex; justify-content:space-between;"><span class="text-muted">Condition:</span><span class="font-medium">${asset.condition}</span></li>
      <li style="display:flex; justify-content:space-between;"><span class="text-muted">Assigned Date:</span><span class="font-medium">${asset.assignedDate}</span></li>
      <li style="display:flex; justify-content:space-between;"><span class="text-muted">Expected Return:</span><span class="font-medium">${asset.returnDate}</span></li>
    </ul>
  `;
  document.getElementById('detAssetSpecs').innerHTML = specsHtml;
  
  document.getElementById('detHealthScore').textContent = asset.healthScore;
  const ring = document.getElementById('detHealthRing');
  if (ring) ring.style.strokeDasharray = \`\${asset.healthScore}, 100\`;
  
  let hStatus = 'Excellent';
  if(asset.healthScore < 50) hStatus = 'Replacement Recommended';
  else if(asset.healthScore < 70) hStatus = 'Needs Attention';
  else if(asset.healthScore < 90) hStatus = 'Healthy';
  
  document.getElementById('detHealthStatus').textContent = hStatus;
  document.getElementById('detBookValue').textContent = asset.bookValue;
  document.getElementById('detWarranty').textContent = asset.warranty;
  
  let rec = 'Asset is performing normally.';
  if (asset.healthScore < 50) rec = 'Asset health is poor. Please raise a maintenance request.';
  else if (asset.healthScore < 70) rec = 'Consider scheduling preventive maintenance.';
  document.getElementById('detRecommendation').textContent = rec;
  
  document.getElementById('modalAssetDetails').classList.add('open');
};

function renderBookResources() {
  const grid = document.getElementById('bookingResultsGrid');
  if (!grid) return;
  
  grid.innerHTML = AVAILABLE_RESOURCES.map(res => `
    <div style="border:1px solid var(--color-border); border-radius:8px; padding:16px; display:flex; flex-direction:column; gap:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="badge badge--${res.status === 'Available' ? 'success' : 'default'}">${res.status}</span>
        <span style="font-size:12px; color:var(--color-text-muted); text-transform:uppercase;">${res.type}</span>
      </div>
      <h4 style="font-size:16px; font-weight:600; margin:0;">${res.name}</h4>
      <div style="font-size:13px; color:var(--color-text-muted);">
        Location: ${res.building} ${res.floor !== '-' ? `(Floor ${res.floor})` : ''}
      </div>
      <div style="font-size:13px; color:var(--color-text-muted);">
        Capacity: ${res.capacity}
      </div>
      <button class="btn btn--primary" style="margin-top:auto;" ${res.status !== 'Available' ? 'disabled' : ''} onclick="alert('Booking request submitted for ${res.name}')">Book Now</button>
    </div>
  `).join('');
}

