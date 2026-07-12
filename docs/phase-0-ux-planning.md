# AssetFlow AI Phase 0 UX Planning

This document defines the planning order before new feature code is written:

User Flow -> Wireframe -> Database -> API -> Frontend -> Testing

It also maps the complete enterprise journey:

Login -> Dashboard -> Assets -> Allocation -> Booking -> Maintenance -> Audit -> Analytics

## 1. User Flow

### Roles

- ADMIN: owns organization setup, users, departments, categories, full asset visibility, reports, and system settings.
- ASSET_MANAGER: owns asset registration, allocation, transfers, maintenance coordination, audits, and asset analytics.
- DEPT_HEAD: owns department-level approvals, visibility into department assets, team requests, and audit participation.
- EMPLOYEE: views assigned assets, books shared assets, raises maintenance requests, and participates in audits.
- USER: organization-side general user role for future external/self-service flows.

### Primary Journey

1. Login
   - User chooses organization login or employee login.
   - System validates credentials and role.
   - Proxy redirects to the correct dashboard.

2. Dashboard
   - User sees role-specific summary cards.
   - Admin sees organization health, asset totals, requests, audit progress, and alerts.
   - Employee sees assigned assets, upcoming bookings, maintenance tickets, and notifications.

3. Assets
   - Admin or Asset Manager registers assets.
   - Assets are categorized, tagged, linked to departments, and given lifecycle status.
   - Users browse only the assets they are allowed to see.

4. Allocation
   - Asset Manager assigns an available asset to an employee.
   - System marks asset as allocated and creates custody history.
   - Asset can later be returned or transferred.

5. Booking
   - Employee books a shared asset for a time slot.
   - System prevents overlapping reservations.
   - Booking changes asset state during the reserved window.

6. Maintenance
   - Employee or manager raises a request against an asset.
   - Asset Manager approves, assigns technician details, tracks cost, and resolves.
   - Asset status can become under maintenance until closed.

7. Audit
   - Admin or Asset Manager starts an audit cycle.
   - Auditors verify assets as verified, missing, or damaged.
   - Audit records feed compliance and loss reports.

8. Analytics
   - Leadership reviews asset utilization, maintenance cost, lost/damaged assets, audit compliance, and department-wise distribution.

## 2. Wireframe Plan

### Global Layout

- Left sidebar: Dashboard, Organization, Assets, Allocation, Booking, Maintenance, Audit, Analytics.
- Top bar: search, notifications, profile menu, current role.
- Main content: dense operational screens with tables, filters, drawers, and modals.

### Login Screen

- Two clear panels:
  - Organization Login: ADMIN and USER.
  - Employee Login: EMPLOYEE, DEPT_HEAD, ASSET_MANAGER.
- On success, redirect by role.

### Dashboard

- KPI row:
  - Total assets
  - Available assets
  - Allocated assets
  - Maintenance pending
  - Audit completion
- Main panels:
  - Recent activity
  - Asset status chart
  - Department asset split
  - Pending approvals

### Assets Directory

- Header actions:
  - Add Asset
  - Import Assets
  - Export
  - Generate QR
- Filters:
  - Status
  - Category
  - Department
  - Condition
  - Shared only
- Table columns:
  - Asset tag
  - Name
  - Category
  - Department
  - Holder
  - Status
  - Health score
  - Location
  - Actions
- Asset detail drawer:
  - Core details
  - Allocation history
  - Booking history
  - Maintenance history
  - Audit records

### Asset Registration

- Form sections:
  - Identity: asset tag, name, serial number, photo.
  - Classification: category, department, location, shared asset flag.
  - Financials: purchase date, cost.
  - Condition: condition, health score, status.
  - QR: generated QR field or uploaded QR reference.
  - Category custom fields.

### Allocation & Transfer

- Available asset list on the left.
- Allocation form on the right:
  - Asset
  - Holder
  - Department
  - Allocation date
  - Expected return date, if temporary
  - Notes, if added later
- Active allocations table:
  - Asset
  - Holder
  - Department
  - Allocated date
  - Status
  - Return
  - Transfer
- Transfer modal:
  - Current holder
  - New holder
  - Transfer reason
  - Effective date

### Booking

- Shared asset list.
- Calendar or time-slot selector.
- Booking form:
  - Asset
  - Start time
  - End time
  - Purpose, if added later
- Bookings table:
  - Upcoming
  - Ongoing
  - Completed
  - Cancelled

### Maintenance

- Request form:
  - Asset
  - Priority
  - Description
  - Attachments
- Manager queue:
  - Pending
  - Approved
  - In progress
  - Resolved
  - Rejected
- Detail view:
  - Asset details
  - Requester
  - Technician
  - Cost
  - Status timeline

### Audit

- Audit cycle setup:
  - Name
  - Scope by department/category/status
  - Start date
  - End date
- Audit execution table:
  - Asset
  - Expected department/location
  - Auditor
  - Verification status
  - Remarks
- Audit summary:
  - Verified
  - Missing
  - Damaged
  - Pending

### Analytics

- Asset lifecycle metrics.
- Utilization rate for shared assets.
- Maintenance cost by category and department.
- Audit compliance.
- Lost, damaged, retired, and disposed assets.

## 3. Database Plan

The current Prisma schema already contains the core models required for the journey:

- User
- Department
- AssetCategory
- Asset
- Allocation
- Booking
- MaintenanceRequest
- AuditCycle
- AuditRecord
- Notification
- ActivityLog
- LoginHistory

### Recommended Phase 3 Database Checks

- Asset should remain the central entity for registration, directory, bookings, maintenance, and audits.
- Allocation should represent custody history, not only current ownership.
- Only one Allocation should be ACTIVE for a non-shared asset at a time.
- Asset status should update when allocation, return, booking, maintenance, retirement, or disposal happens.
- Booking should only be allowed for assets where isShared is true.
- MaintenanceRequest should optionally link to technician user in a future schema update.
- AuditRecord should eventually relate auditorId to User for stronger relational integrity.

### Possible Later Enhancements

- Add AllocationTransfer model if transfer approvals need a separate workflow.
- Add AssetDocument model for invoices, warranties, manuals, and photos.
- Add Location model if locations become structured instead of free text.
- Add ApprovalRequest model if department heads must approve allocations/bookings.

## 4. API Plan

### Existing APIs

- GET/POST /api/departments
- GET/POST /api/categories
- GET/PUT /api/users
- Auth routes under /api/auth

### Phase 3 Asset APIs

- GET /api/assets
  - List assets with filters: status, categoryId, departmentId, condition, isShared, query.
- POST /api/assets
  - Create a new asset.
- GET /api/assets/[id]
  - Return asset detail with category, department, active allocation, booking history, maintenance history, audit records.
- PUT /api/assets/[id]
  - Update asset details.
- DELETE or PATCH /api/assets/[id]/retire
  - Retire asset without hard deletion.

### Phase 3 Allocation APIs

- GET /api/allocations
  - List active and historical allocations.
- POST /api/allocations
  - Allocate available asset to holder.
- PATCH /api/allocations/[id]/return
  - Mark allocation returned and set asset available.
- POST /api/allocations/[id]/transfer
  - Return current allocation and create a new active allocation.

### Future APIs

- POST /api/bookings
- PATCH /api/bookings/[id]/cancel
- POST /api/maintenance
- PATCH /api/maintenance/[id]
- POST /api/audits
- POST /api/audits/[id]/records
- GET /api/analytics/summary

### API Security

- ADMIN and ASSET_MANAGER can create and update assets.
- ADMIN and ASSET_MANAGER can allocate, return, and transfer assets.
- DEPT_HEAD can view department assets and approve future department workflows.
- EMPLOYEE can view assigned assets, book shared assets, and raise maintenance requests.

## 5. Frontend Plan

### Phase 3 Pages

- /admin/assets
  - Asset directory and registration.
- /admin/assets/[id]
  - Asset detail page or drawer route if needed later.
- /admin/allocations
  - Allocation, return, and transfer workspace.

### Later Pages

- /employee/assets
- /employee/bookings
- /employee/maintenance
- /admin/bookings
- /admin/maintenance
- /admin/audit
- /admin/analytics

### Shared UI Components

- AssetStatusBadge
- RoleBadge
- ConditionBadge
- AssetForm
- AssetTable
- AssetFilters
- AllocationForm
- AllocationTable
- ConfirmActionDialog
- EmptyState

### UX Rules

- Keep admin screens operational and table-first.
- Use drawers or modals for quick actions.
- Avoid hiding key actions behind unclear menus.
- Every status change should be visible in activity history.
- Never delete business records when a lifecycle status is enough.

## 6. Testing Plan

### Manual UX Checks

- Login redirects each role correctly.
- Sidebar shows only allowed destinations.
- Admin can create department, category, employee, and asset records.
- Asset Manager can allocate an available asset.
- Allocated assets cannot be double-allocated.
- Returned assets become available.
- Transferred assets close old custody and create new custody.
- Shared assets can be booked.
- Non-shared assets cannot be booked.
- Maintenance status changes are reflected on asset detail.
- Audit records appear on asset detail and audit summary.

### API Checks

- Unauthorized users receive 401 or 403.
- Required fields return clear validation errors.
- Filtering works for asset directory.
- Allocation updates asset status atomically.
- Return updates allocation and asset status atomically.
- Transfer does not leave two active allocations.

### Build Checks

- npm run lint
- npm run build
- Prisma client generation after schema changes.
- Manual browser pass for desktop and mobile layouts.

## 7. Phase 3 Build Order

1. Create asset service functions.
2. Create /api/assets routes.
3. Build /admin/assets directory UI.
4. Add asset registration form.
5. Create allocation service functions.
6. Create /api/allocations routes.
7. Build /admin/allocations workspace.
8. Run lint and build.
9. Manually test the journey from asset creation to allocation, transfer, and return.

