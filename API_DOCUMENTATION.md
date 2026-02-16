# MIL Workshop Management System - Complete API Documentation

**Base URL:** `http://localhost:3001` (Development)  
**Production URL:** Your production URL  
**API Documentation (Swagger):** `http://localhost:3001/api`

## Table of Contents

1. [Authentication](#authentication)
2. [Workshops](#workshops)
3. [User Units](#user-units)
4. [Entries](#entries)
5. [Job Carts](#job-carts)
6. [Exits](#exits)
7. [Consume Requests](#consume-requests)
8. [Spare Parts](#spare-parts)
9. [Inventory](#inventory)
10. [Source Requests](#source-requests)
11. [Log Book](#log-book)
12. [Chat](#chat)
13. [Users](#users)

---

## Authentication

All endpoints (except login) require Bearer token authentication.

### POST `/auth/login`

**Description:** Authenticate user and get access token  
**Public:** Yes  
**Request Body:**

```json
{
  "email": "inspector@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "inspector@example.com",
    "full_name": "John Doe",
    "role": "inspector_ri&i",
    "workshop_id": "uuid"
  }
}
```

### POST `/auth/logout`

**Description:** Logout user and invalidate token  
**Request Body:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1..."
}
```

### GET `/auth/me`

**Description:** Get current authenticated user  
**Roles:** All authenticated users  
**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "inspector_ri&i",
  "workshop_id": "uuid",
  "avatar_url": "https://..."
}
```

### GET `/auth/permissions`

**Description:** Get permissions for current user  
**Roles:** All authenticated users

---

## Workshops

### POST `/workshops`

**Description:** Create a new workshop  
**Roles:** ADMIN  
**Request Body:**

```json
{
  "name": "Central Workshop",
  "location": "Building A, Floor 2",
  "workshop_type": "VEHICLE"
}
```

### GET `/workshops`

**Description:** Get all workshops (inspectors see only assigned workshops)  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Response:** Array of workshop objects

### GET `/workshops/:id`

**Description:** Get specific workshop by ID  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Params:** `id` - Workshop UUID

### GET `/workshops/:id/analytics`

**Description:** Get dashboard analytics for workshop  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Response:**

```json
{
  "totalEntries": 150,
  "activeUnits": 25,
  "completedMaintenance": 120,
  "pendingApprovals": 5
}
```

### GET `/workshops/:id/stats`

**Description:** Get detailed statistics for workshop  
**Roles:** ADMIN, OC

### GET `/workshops/:id/users`

**Description:** Get all users assigned to workshop  
**Roles:** ADMIN, OC

### PATCH `/workshops/:id`

**Description:** Update workshop details  
**Roles:** ADMIN, OC  
**Request Body:** Partial workshop object

### PATCH `/workshops/:id/assign-roles`

**Description:** Assign roles (inspector, store_man, captain, OC) to workshop  
**Roles:** ADMIN, OC  
**Request Body:**

```json
{
  "inspector_id": "uuid",
  "store_man_id": "uuid",
  "captain_id": "uuid",
  "oc_id": "uuid"
}
```

### GET `/workshops/:id/readiness`

**Description:** Check if all required roles are assigned  
**Roles:** ADMIN, OC, CAPTAIN  
**Response:**

```json
{
  "isReady": true,
  "inspector": { "assigned": true, "user": {...} },
  "store_man": { "assigned": true, "user": {...} },
  "captain": { "assigned": true, "user": {...} },
  "oc": { "assigned": true, "user": {...} }
}
```

### DELETE `/workshops/:id`

**Description:** Delete workshop  
**Roles:** ADMIN

---

## User Units

User units represent weapons or vehicles being maintained.

### POST `/user-unit`

**Description:** Register a new weapon/vehicle  
**Roles:** INSPECTOR_RI_AND_I, OC, ADMIN  
**Request Body:**

```json
{
  "unit_type": "WEAPON",
  "workshop_id": "uuid",
  "ba_regt_no": 26631,
  "full_name_with_model": "Motor Cycle 125cc Runner Turbo",
  "country_of_origin": "Bangladesh",
  "year_of_manufacture": 2020,
  "present_km": 15000
}
```

### GET `/user-unit`

**Description:** Get all user units  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Query Params:**

- `workshopId` (optional) - Filter by workshop

### GET `/user-unit/workshop/:workshopId/in-workshop`

**Description:** Get all units currently in specified workshop  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### GET `/user-unit/:id`

**Description:** Get user unit by ID  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### PATCH `/user-unit/:id`

**Description:** Update user unit  
**Roles:** OC, ADMIN

### PATCH `/user-unit/:id/status`

**Description:** Update unit status  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "status": "IN_WORKSHOP"
}
```

**Status Values:** `IN_WORKSHOP`, `UNDER_MAINTENANCE`, `COMPLETED`, `EXITED`

### PATCH `/user-unit/:id/mark-completed`

**Description:** ⭐ **NEW** - Store man marks unit as COMPLETED after maintenance work  
**Roles:** STORE_MAN  
**Behavior:** Changes status from `UNDER_MAINTENANCE` → `COMPLETED`

### PATCH `/user-unit/:id/move-to-workshop`

**Description:** ⭐ **NEW** - Inspector moves COMPLETED unit back to IN_WORKSHOP  
**Roles:** INSPECTOR_RI_AND_I  
**Behavior:** Changes status from `COMPLETED` → `IN_WORKSHOP` (after verification)

### DELETE `/user-unit/:id`

**Description:** Delete user unit  
**Roles:** ADMIN

---

## Entries

Entries track when units enter the workshop.

### POST `/entries`

**Description:** ⭐ **UPDATED** - Create entry when unit enters workshop  
**Roles:** INSPECTOR_RI_AND_I  
**Request Body:**

```json
{
  "workshop_id": "uuid",
  "user_unit_id": "uuid",
  "ba_no": "BA-2024-001",
  "unit": "3rd Battalion",
  "odometer_km": 15000,
  "condition_notes": "Engine making unusual noise"
}
```

**New Fields:**

- `ba_no` (optional) - Book Authorization Number
- `unit` (optional) - Battalion/Unit name

**Behavior:** Automatically sets user_unit status to `IN_WORKSHOP`

### GET `/entries`

**Description:** Get all entries with filters  
**Roles:** ADMIN, OC, CAPTAIN, INSPECTOR_RI_AND_I  
**Query Params:**

- `workshop_id` (optional)
- `user_unit_id` (optional)
- `has_exit` (boolean, optional) - Filter by exit status
- `page` (default: 1)
- `limit` (default: 20)

### GET `/entries/:id`

**Description:** Get entry by ID  
**Roles:** ADMIN, OC, CAPTAIN, INSPECTOR_RI_AND_I, STORE_MAN

### PATCH `/entries/:id`

**Description:** Update entry (only creator can update)  
**Roles:** INSPECTOR_RI_AND_I

---

## Job Carts

Job carts are work orders for maintenance.

### POST `/job-carts`

**Description:** ⭐ **UPDATED** - Create job cart for maintenance work  
**Roles:** INSPECTOR_RI_AND_I  
**Request Body:**

```json
{
  "entry_id": "uuid",
  "spare_part_id": "uuid or null",
  "requested_quantity": 2,
  "notes": "Engine overhaul required"
}
```

**Changed Behavior:**

- `spare_part_id` is now **OPTIONAL** (inspector creates, store_man decides parts)
- Automatically set to `ISSUED` status (no approval needed)
- Automatically sets user_unit status to `UNDER_MAINTENANCE`

### GET `/job-carts`

**Description:** Get all job carts  
**Roles:** ADMIN, OC, CAPTAIN, INSPECTOR_RI_AND_I, STORE_MAN  
**Query Params:**

- `workshop_id` (optional)
- `entry_id` (optional)
- `user_unit_id` (optional)
- `status` (optional) - PENDING, APPROVED, ISSUED, REJECTED, VETOED
- `page` (default: 1)
- `limit` (default: 20)

**Note:** Store managers see all job carts from their workshop

### GET `/job-carts/:id`

**Description:** Get job cart by ID with inventory info  
**Roles:** ADMIN, OC, CAPTAIN, INSPECTOR_RI_AND_I, STORE_MAN

### POST `/job-carts/:id/approve`

**Description:** ⚠️ **HIDDEN FROM SWAGGER** (still functional)  
**Roles:** CAPTAIN, OC

### POST `/job-carts/:id/reject`

**Description:** ⚠️ **HIDDEN FROM SWAGGER** (still functional)  
**Roles:** CAPTAIN, OC

### POST `/job-carts/:id/veto`

**Description:** ⚠️ **HIDDEN FROM SWAGGER** (still functional)  
**Roles:** OC

### POST `/job-carts/:id/issue`

**Description:** ⚠️ **HIDDEN FROM SWAGGER** (still functional)  
**Roles:** OC

---

## Exits

Exits track when units leave the workshop.

### POST `/exits`

**Description:** ⭐ **UPDATED** - Create exit when unit leaves workshop  
**Roles:** INSPECTOR_RI_AND_I  
**Request Body:**

```json
{
  "entry_id": "uuid",
  "unit": "3rd Battalion",
  "odometer_km": 15500,
  "work_performed": "Oil change, gear box replaced",
  "exit_condition_notes": "All systems operational"
}
```

**Changed Behavior:**

- `unit` field is now **MANDATORY** (validation enforced)
- Automatically sets user_unit status to `EXITED`
- Updates user_unit `exited_at` timestamp

### GET `/exits`

**Description:** Get all exits with filters  
**Roles:** ADMIN, OC, CAPTAIN, INSPECTOR_RI_AND_I  
**Query Params:**

- `workshop_id` (optional)
- `entry_id` (optional)
- `user_unit_id` (optional)
- `page` (default: 1)
- `limit` (default: 20)

### GET `/exits/:id`

**Description:** Get exit by ID  
**Roles:** ADMIN, OC, CAPTAIN, INSPECTOR_RI_AND_I, STORE_MAN

---

## Consume Requests

Requests to consume spare parts from inventory.

### POST `/consume-request`

**Description:** ⭐ **UPDATED** - Create request to consume spare parts  
**Roles:** INSPECTOR_RI_AND_I, OC, ADMIN  
**Request Body:**

```json
{
  "user_unit_id": "uuid",
  "spare_part_id": "uuid",
  "requested_quantity": 2,
  "requested_by_id": "uuid",
  "notes": "Urgent replacement needed"
}
```

**Note:** The entity now has `job_cart_id` field, but DTO may need updating

### GET `/consume-request`

**Description:** Get all consume requests  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Query Params:**

- `userUnitId` (optional)
- `status` (optional) - PENDING, APPROVED, REJECTED

### GET `/consume-request/pending/:workshopId`

**Description:** Get pending requests for workshop  
**Roles:** ADMIN, OC

### GET `/consume-request/:id`

**Description:** Get consume request by ID  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### PATCH `/consume-request/:id`

**Description:** Update consume request  
**Roles:** OC, ADMIN

### PATCH `/consume-request/:id/approve`

**Description:** Approve request and consume inventory  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "approvedById": "uuid"
}
```

### PATCH `/consume-request/:id/reject`

**Description:** Reject consume request  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "approvedById": "uuid",
  "reason": "Insufficient stock available"
}
```

### DELETE `/consume-request/:id`

**Description:** Delete consume request  
**Roles:** ADMIN

---

## Spare Parts

Spare parts catalog/templates.

### POST `/spare-part`

**Description:** Create spare part template  
**Roles:** ADMIN, OC  
**Request Body:**

```json
{
  "name": "Engine Oil 5W-30",
  "part_number": "EO-5W30-001",
  "equipment_type": "VEHICLE",
  "unit_of_measurement": "liters",
  "min_quantity": 10
}
```

### GET `/spare-part`

**Description:** Get all spare parts  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Query Params:**

- `equipmentType` (optional) - Filter by equipment type

### GET `/spare-part/search`

**Description:** Search spare parts by name  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Query Params:**

- `name` (required) - Search term

### GET `/spare-part/:id`

**Description:** Get spare part by ID  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### PATCH `/spare-part/:id`

**Description:** Update spare part  
**Roles:** ADMIN, OC

### DELETE `/spare-part/:id`

**Description:** Delete spare part  
**Roles:** ADMIN

---

## Inventory

Workshop inventory management.

### POST `/inventory`

**Description:** Add inventory item to workshop  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "workshop_id": "uuid",
  "spare_part_id": "uuid",
  "quantity": 100,
  "min_quantity": 10
}
```

### GET `/inventory`

**Description:** Get all inventory items  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Query Params:**

- `workshopId` (optional)

### GET `/inventory/low-stock/:workshopId`

**Description:** Get items below minimum quantity  
**Roles:** ADMIN, OC

### GET `/inventory/:id`

**Description:** Get inventory item by ID  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### PATCH `/inventory/:id`

**Description:** Update inventory item  
**Roles:** OC, ADMIN

### PATCH `/inventory/:id/consume`

**Description:** Reduce inventory by quantity  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "quantity": 5
}
```

### PATCH `/inventory/:id/add`

**Description:** Increase inventory by quantity  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "quantity": 20
}
```

### DELETE `/inventory/:id`

**Description:** Delete inventory item  
**Roles:** ADMIN

---

## Source Requests

Requests to source parts from external suppliers.

### POST `/source-request`

**Description:** Create request to source parts externally  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "workshop_id": "uuid",
  "spare_part_id": "uuid",
  "quantity": 50,
  "estimated_cost": 5000,
  "reason": "Stock depleted"
}
```

### GET `/source-request`

**Description:** Get all source requests  
**Roles:** ADMIN, OC  
**Query Params:**

- `workshopId` (optional)
- `status` (optional) - PENDING, APPROVED, SOURCED, REJECTED

### GET `/source-request/:id`

**Description:** Get source request by ID  
**Roles:** ADMIN, OC

### PATCH `/source-request/:id`

**Description:** Update source request  
**Roles:** OC, ADMIN

### PATCH `/source-request/:id/approve`

**Description:** Approve source request  
**Roles:** OC, ADMIN

### PATCH `/source-request/:id/sourced`

**Description:** Mark request as sourced  
**Roles:** OC, ADMIN  
**Request Body:**

```json
{
  "supplierName": "Defense Supply Co.",
  "totalCost": 5000.0
}
```

### DELETE `/source-request/:id`

**Description:** Delete source request  
**Roles:** ADMIN

---

## Log Book

Maintenance and activity logs for user units.

### POST `/log-book`

**Description:** Create log entry  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Request Body:**

```json
{
  "user_unit_id": "uuid",
  "log_type": "MAINTENANCE",
  "description": "Oil change completed",
  "performed_by_id": "uuid",
  "metadata": {}
}
```

**Log Types:** ENTRY, EXIT, MAINTENANCE, INVENTORY_CONSUMED, COMMENT, ENTRY_CREATED, ENTRY_UPDATED, EXIT_CREATED, JOB_CARD_CREATED, etc.

### GET `/log-book`

**Description:** Get all log entries  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Query Params:**

- `userUnitId` (optional)

### GET `/log-book/user-unit/:userUnitId`

**Description:** Get logs for specific user unit  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### GET `/log-book/:id`

**Description:** Get log entry by ID  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### PATCH `/log-book/:id`

**Description:** Update log entry  
**Roles:** OC, ADMIN

### DELETE `/log-book/:id`

**Description:** Delete log entry  
**Roles:** ADMIN

---

## Chat

Unit-related messaging system.

### POST `/chat`

**Description:** Send chat message for user unit  
**Roles:** INSPECTOR_RI_AND_I, OC, ADMIN  
**Request Body:**

```json
{
  "user_unit_id": "uuid",
  "sender_id": "uuid",
  "message": "Need approval for parts request"
}
```

### GET `/chat`

**Description:** Get all chat messages  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I  
**Query Params:**

- `userUnitId` (optional)

### GET `/chat/unread/:userUnitId`

**Description:** Get unread message count  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### GET `/chat/:id`

**Description:** Get chat message by ID  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### PATCH `/chat/:id`

**Description:** Update chat message  
**Roles:** OC, ADMIN

### PATCH `/chat/:id/read`

**Description:** Mark message as read  
**Roles:** ADMIN, OC, INSPECTOR_RI_AND_I

### DELETE `/chat/:id`

**Description:** Delete chat message  
**Roles:** ADMIN

---

## Users

User management endpoints.

### POST `/users`

**Description:** Create new user  
**Roles:** ADMIN, OC  
**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "inspector_ri&i",
  "workshop_id": "uuid"
}
```

**Roles:** `admin`, `oc`, `captain`, `inspector_ri&i`, `store_man`

### GET `/users`

**Description:** Get all users  
**Roles:** ADMIN, OC

### GET `/users/:id`

**Description:** Get user by ID  
**Roles:** ADMIN, OC

### PATCH `/users/:id`

**Description:** Update user  
**Roles:** ADMIN, OC

### DELETE `/users/:id`

**Description:** Delete user  
**Roles:** ADMIN

---

## Complete Workflow Summary

### Entry → Maintenance → Exit Flow

1. **Inspector creates Entry** (with BA_NO, unit)
   - `POST /entries`
   - User unit status → `IN_WORKSHOP`

2. **Inspector creates Job Cart**
   - `POST /job-carts`
   - User unit status → `UNDER_MAINTENANCE`
   - Spare part is optional

3. **Store Man creates Consume Requests** (if parts needed)
   - `POST /consume-request` (with job_cart_id)

4. **Inspector approves/rejects Consume Requests**
   - `PATCH /consume-request/:id/approve`
   - `PATCH /consume-request/:id/reject`

5. **Store Man marks unit as COMPLETED**
   - `PATCH /user-unit/:id/mark-completed`
   - User unit status → `COMPLETED`

6. **Inspector moves unit to IN_WORKSHOP** (after verification)
   - `PATCH /user-unit/:id/move-to-workshop`
   - User unit status → `IN_WORKSHOP`

7. **Inspector creates Exit** (mandatory unit field)
   - `POST /exits`
   - User unit status → `EXITED`

---

## User Unit Status Flow

```
Entry Created → IN_WORKSHOP
      ↓
Job Cart Created → UNDER_MAINTENANCE
      ↓
Store Man Completes → COMPLETED
      ↓
Inspector Verifies → IN_WORKSHOP
      ↓
Exit Created → EXITED
```

---

## Role Permissions Summary

| Role                   | Can Do                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| **ADMIN**              | Everything                                                                       |
| **OC**                 | Manage workshops, assign roles, approve requests, manage users                   |
| **CAPTAIN**            | Approve job carts, view workshop data                                            |
| **INSPECTOR_RI_AND_I** | Create entries/exits/job carts, approve consume requests, move units to workshop |
| **STORE_MAN**          | View job carts, create consume requests, mark units as completed                 |

---

## Authentication Headers

All authenticated endpoints require:

```
Authorization: Bearer <access_token>
```

---

## Error Responses

Standard error format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict

---

## Notes for Frontend Implementation

1. **Status Badges:** Implement color-coded badges for user unit statuses
2. **Role-Based UI:** Show/hide features based on user role
3. **Mandatory Fields:** Exit requires `unit` field (validation enforced)
4. **Job Cart Update:** Spare part is now optional in job cart creation
5. **New Endpoints:** Use new mark-completed and move-to-workshop endpoints
6. **Logs:** All status changes are automatically logged with user_unit_id
7. **Consume Requests:** Should ideally include job_cart_id (DTO may need update)

---

## Development

**Swagger UI:** `http://localhost:3001/api`  
Visit Swagger for interactive API testing with request/response examples.
