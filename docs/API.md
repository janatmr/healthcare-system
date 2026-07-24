# API Documentation

Two HTTP services share JWT authentication (same `JWT_SECRET`) and one MongoDB database.

| Service | Default local | Cloud |
|---------|---------------|--------|
| Backend | `http://localhost:5000` | Vercel (e.g. `https://…vercel.app`) |
| Appointment | `http://localhost:5001` | Separate Vercel project |

**Common headers**

| Header | When |
|--------|------|
| `Content-Type: application/json` | JSON request bodies |
| `Authorization: Bearer <token>` | All protected routes |

**Common error shape**

```json
{ "success": false, "message": "Human-readable error" }
```

Validation failures typically return **400**. Auth failures **401**. Forbidden roles **403**. Missing resources **404**. Rate limit **429**.

**Roles:** `Admin`, `Doctor`, `Nurse`

---

## Backend — Health

### `GET /health`

| Field | Value |
|-------|--------|
| Authentication | None |
| Success | `200` `{ "status": "ok" }` |

```bash
curl https://YOUR-BACKEND/health
```

---

## Backend — Auth

### `POST /auth/login`

| Field | Value |
|-------|--------|
| Authentication | None |
| Body | `{ "email": string, "password": string }` |
| Validation | Valid email required; password required |
| Success | `200` `{ "success": true, "token": "<jwt>", "user": { … } }` |
| Errors | `401` invalid credentials; `400` validation |

```bash
curl -X POST https://YOUR-BACKEND/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.local","password":"Password123!"}'
```

### `POST /auth/logout`

| Field | Value |
|-------|--------|
| Authentication | Bearer JWT |
| Success | `200` `{ "success": true, "message": "Logged out successfully" }` |

Client should discard the token (stateless JWT).

### `POST /auth/register`

| Field | Value |
|-------|--------|
| Authentication | **Admin** JWT, **or** public when DB has zero users (bootstrap Admin only) |
| Body | `firstName`, `lastName`, `email`, `password` (≥8), `role` (`Admin`\|`Doctor`\|`Nurse`), optional `department` |
| Success | `201` `{ "success": true, "user": { … } }` |
| Errors | `400` validation / duplicate email; `403` non-Admin when users exist |

### `GET /auth/profile`

| Field | Value |
|-------|--------|
| Authentication | Bearer JWT |
| Success | `200` `{ "success": true, "user": { … } }` |

### `PATCH /auth/change-password`

| Field | Value |
|-------|--------|
| Authentication | Bearer JWT |
| Body | `{ "currentPassword": string, "newPassword": string }` (≥8, different from current) |
| Success | `200` `{ "success": true, "message": "…" }` |
| Errors | `400` / `401` wrong current password |

---

## Backend — Patients

Roles: list/get/status — Admin, Doctor, Nurse. Create/update/delete — Admin, Doctor.

### `GET /patients`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor/Nurse |
| Query | `page` (≥1), `limit` (1–100), `status` (`Good`\|`Stable`\|`Critical`), `search`, `sort` |
| Success | `200` `{ "success": true, "data": […], "pagination": { … } }` |

### `GET /patients/:id`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor/Nurse |
| Params | MongoDB ObjectId |
| Success | `200` `{ "success": true, "data": { … } }` |
| Errors | `400` invalid id; `404` not found |

### `POST /patients`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor |
| Body | Required: `firstName`, `lastName`, `gender` (`Male`\|`Female`\|`Other`), `dateOfBirth` (ISO8601), `phone`. Optional: `email`, `address`, `bloodGroup` (`A+`…`O-`), `emergencyContact`, `allergies[]`, `medicalConditions[]`, `status` |
| Success | `201` `{ "success": true, "data": { … } }` |

```json
{
  "firstName": "Sam",
  "lastName": "Patient",
  "gender": "Male",
  "dateOfBirth": "1990-05-01",
  "phone": "+1-555-0100",
  "status": "Stable"
}
```

### `PUT /patients/:id`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor |
| Body | Any create fields (all optional; empty strings rejected where applicable) |
| Success | `200` `{ "success": true, "data": { … } }` |

### `PATCH /patients/:id/status`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor/Nurse |
| Body | `{ "status": "Good" \| "Stable" \| "Critical" }` |
| Success | `200` `{ "success": true, "data": { … } }` |

### `DELETE /patients/:id`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor |
| Success | `200` `{ "success": true, "message": "…" }` |
| Errors | `404` not found |

---

## Backend — Medical records

Roles: list/get — Admin, Doctor, Nurse. Mutate — Admin, Doctor.

### `GET /records`

| Field | Value |
|-------|--------|
| Query | `page`, `limit`, `patientId` (ObjectId), `sort` |
| Success | `200` `{ "success": true, "data": […], "pagination": { … } }` |

### `GET /records/:id`

| Field | Value |
|-------|--------|
| Success | `200` `{ "success": true, "data": { … } }` |
| Errors | `404` |

### `POST /records`

| Field | Value |
|-------|--------|
| Body | Required: `patientId`, `diagnosis`. Optional: `medication[]`, `labResults[]`, `prescriptions[]`, `referrals[]`, `doctorNotes`, `visitDate` |
| Success | `201` `{ "success": true, "data": { … } }` |

```json
{
  "patientId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "diagnosis": "Hypertension",
  "doctorNotes": "Follow up in 2 weeks",
  "medication": ["Lisinopril 10mg"]
}
```

### `PUT /records/:id`

| Field | Value |
|-------|--------|
| Body | Partial update of create fields |
| Success | `200` `{ "success": true, "data": { … } }` |

### `DELETE /records/:id`

| Field | Value |
|-------|--------|
| Success | `200` `{ "success": true, "message": "…" }` |

---

## Backend — Dashboard

### `GET /dashboard/statistics`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor/Nurse |
| Success | `200` with patient/record counts and appointment summary (backend calls appointment service) |
| Errors | Appointment service unreachable may yield degraded appointment stats / errors depending on client handling |

```bash
curl https://YOUR-BACKEND/dashboard/statistics \
  -H "Authorization: Bearer $TOKEN"
```

---

## Appointment service — Health

### `GET /health`

Public. `200` `{ "status": "ok" }`.

---

## Appointment service — Appointments

Statuses: `Pending`, `Confirmed`, `Cancelled`, `Completed`.  
Roles: list/get — Admin, Doctor, Nurse. Create/update/status/delete — Admin, Doctor.  
JWT must be issued by the **backend** login (shared secret).

### `GET /appointments/stats/summary`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor/Nurse |
| Success | `200` summary counts by status / totals used by dashboard |

### `GET /appointments`

| Field | Value |
|-------|--------|
| Query | `page`, `limit`, `status`, `doctorId`, `patientId`, `date` (ISO8601), `sort` |
| Success | `200` `{ "success": true, "data": […], "pagination": { … } }` |

### `GET /appointments/doctor/:doctorId`

| Field | Value |
|-------|--------|
| Params | Doctor user ObjectId |
| Success | `200` list for that doctor |

### `GET /appointments/patient/:patientId`

| Field | Value |
|-------|--------|
| Params | Patient ObjectId |
| Success | `200` list for that patient |

### `GET /appointments/:id`

| Field | Value |
|-------|--------|
| Success | `200` `{ "success": true, "data": { … } }` |
| Errors | `404` |

### `POST /appointments`

| Field | Value |
|-------|--------|
| Body | Required: `patientId`, `doctorId`, `appointmentDate` (ISO8601), `appointmentTime` (`HH:mm`), `department`. Optional: `duration` (≥5 minutes), `status`, `notes` |
| Success | `201` `{ "success": true, "data": { … } }` |
| Errors | `400` validation / scheduling conflict |

```json
{
  "patientId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "doctorId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "appointmentDate": "2026-08-01",
  "appointmentTime": "09:30",
  "duration": 30,
  "department": "Cardiology",
  "notes": "Annual checkup"
}
```

### `PUT /appointments/:id`

| Field | Value |
|-------|--------|
| Body | Partial update of create fields |
| Success | `200` `{ "success": true, "data": { … } }` |

### `PATCH /appointments/:id/status`

| Field | Value |
|-------|--------|
| Body | `{ "status": "Pending" \| "Confirmed" \| "Cancelled" \| "Completed" }` |
| Success | `200` `{ "success": true, "data": { … } }` |

### `DELETE /appointments/:id`

| Field | Value |
|-------|--------|
| Authentication | Bearer + Admin/Doctor |
| Success | `200` `{ "success": true, "message": "…" }` |

---

## Real-time synchronization (client)

The React client uses TanStack Query with a **15s** `refetchInterval` (see `frontend/src/lib/query.js`) so dashboard, patients, records, and appointments stay in sync across concurrent users without WebSockets. Mutations still invalidate related query keys immediately for the acting user.
