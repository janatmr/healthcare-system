# Appointment Service

Independent microservice for hospital appointment booking, scheduling, and availability.

Runs separately from the main backend so appointment traffic does not affect patients, records, or auth.

## Endpoints

| Method | Path | Access |
|--------|------|--------|
| `GET` | `/health` | Public |
| `GET` | `/appointments` | Admin, Doctor, Nurse |
| `GET` | `/appointments/stats/summary` | Admin, Doctor, Nurse |
| `GET` | `/appointments/doctor/:doctorId` | Admin, Doctor, Nurse |
| `GET` | `/appointments/patient/:patientId` | Admin, Doctor, Nurse |
| `GET` | `/appointments/:id` | Admin, Doctor, Nurse |
| `POST` | `/appointments` | Admin, Doctor |
| `PUT` | `/appointments/:id` | Admin, Doctor |
| `PATCH` | `/appointments/:id/status` | Admin, Doctor |
| `DELETE` | `/appointments/:id` | Admin, Doctor |

Authenticate with `Authorization: Bearer <token>` from the main backend login.

## Local run

```bash
cp .env.example .env
# Align JWT_SECRET with backend/.env
# MONGODB_URI=mongodb://localhost:27017/healthcare

npm run start:appointment
# or: npm run dev:appointment
```

Default port: **5001**. CORS allowlist: `http://localhost:3000`.

## Isolation

- Owns only the `appointments` collection
- Does not query users, patients, or medical records
- JWT claims (`sub`, `role`) are trusted after signature verification
