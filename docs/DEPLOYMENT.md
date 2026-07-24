# Production Deployment Guide

Deploy the Hospital Management System to:

| Component | Platform | Notes |
|-----------|----------|--------|
| Frontend | **Netlify** | Vite SPA + CDN HTTPS |
| Backend API | **Vercel** | Express via serverless adapter (`backend/api/index.js`) |
| Appointment API | **Vercel** | Second Vercel project (`microservices/appointment-service`) |
| Database | **MongoDB Atlas** | Shared cluster / database for both APIs |

Local Docker Compose and Minikube remain supported — see the root [README.md](../README.md).

### Current production URLs

| Layer | URL |
|-------|-----|
| Frontend | https://stately-sunflower-3fdd50.netlify.app |
| Backend | https://backend-two-murex-65.vercel.app |
| Appointment | https://appointment-service-phi.vercel.app |
| Database | MongoDB Atlas project **Healthcare System**, cluster **healthcare** |

---

## Architecture (cloud)

```mermaid
flowchart LR
  Browser -->|"HTTPS"| Netlify
  Netlify -->|"JWT"| BackendVercel
  Netlify -->|"JWT"| AppointmentVercel
  BackendVercel -->|"service JWT"| AppointmentVercel
  BackendVercel --> Atlas
  AppointmentVercel --> Atlas
```

**Deploy order (important):** Atlas → Appointment (Vercel) → Backend (Vercel) → Frontend (Netlify).  
Each later step needs the previous URL.

---

## 1. MongoDB Atlas

### Steps

1. Create a free/shared cluster in [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a database user with a strong password (store in a password manager).
3. Network Access → allow the deployment sources:
   - For Vercel serverless: `0.0.0.0/0` (IP allowlist) **or** Atlas VPC peering / private endpoints if available on your plan.
   - Prefer restricting to known egress IPs when your plan supports it.
4. Database Access → note the connection string:
   ```
   mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/healthcare?retryWrites=true&w=majority
   ```
5. Enable backups / continuous cloud backup if offered on your tier.

### Screenshot placeholders

- `[Screenshot: Atlas cluster overview]`
- `[Screenshot: Database user created]`
- `[Screenshot: Network Access allowlist]`

### Seed against Atlas

```bash
# From repo root — never commit the URI
export MONGODB_URI='mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/healthcare?retryWrites=true&w=majority'
npm run seed
```

Default login after seed: `admin@hospital.local` / `Password123!`

---

## 2. Appointment service (Vercel)

### Project settings

| Setting | Value |
|---------|--------|
| Root Directory | `microservices/appointment-service` |
| Framework | Other |
| Build Command | *(leave empty — serverless Node)* |
| Output | Uses `vercel.json` → `api/index.js` |

Config file: [`microservices/appointment-service/vercel.json`](../microservices/appointment-service/vercel.json)

### Environment variables

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `production` | Yes |
| `JWT_SECRET` | long random string (same as backend) | Yes |
| `MONGODB_URI` | Atlas `mongodb+srv://…` | Yes |
| `CORS_ORIGINS` | `https://YOUR_SITE.netlify.app` | Yes (set after Netlify URL is known; update later) |

### Deploy (CLI)

```bash
cd microservices/appointment-service
npx vercel login
npx vercel link          # create/link project
npx vercel env add JWT_SECRET production
npx vercel env add MONGODB_URI production
npx vercel env add NODE_ENV production
npx vercel env add CORS_ORIGINS production
npx vercel --prod
```

If `npm install` fails with a workspaces/`location` error, copy the service folder outside the monorepo (exclude `node_modules` / `tests`), copy `.vercel/project.json`, and run `vercel --prod` from that standalone directory.

Note the production URL, e.g. `https://healthcare-appointment.vercel.app`.

### Verify

```bash
curl https://YOUR-APPOINTMENT.vercel.app/health
# {"status":"ok"}
```

- `[Screenshot: Vercel appointment project env vars]`
- `[Screenshot: /health success]`

---

## 3. Backend API (Vercel)

### Project settings

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Framework | Other |
| Config | [`backend/vercel.json`](../backend/vercel.json) |

### Environment variables

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `production` | Yes |
| `JWT_SECRET` | **same** value as appointment service | Yes |
| `JWT_EXPIRES_IN` | `8h` | Recommended |
| `MONGODB_URI` | Same Atlas URI | Yes |
| `APPOINTMENT_SERVICE_URL` | `https://YOUR-APPOINTMENT.vercel.app` | Yes |
| `CORS_ORIGINS` | `https://YOUR_SITE.netlify.app` | Yes |

### Deploy

```bash
cd backend
npx vercel login
npx vercel link
npx vercel env add JWT_SECRET production
npx vercel env add MONGODB_URI production
npx vercel env add APPOINTMENT_SERVICE_URL production
npx vercel env add NODE_ENV production
npx vercel env add CORS_ORIGINS production
npx vercel env add JWT_EXPIRES_IN production
npx vercel --prod
```

### Verify

```bash
curl https://YOUR-BACKEND.vercel.app/health
# {"status":"ok"}
```

- `[Screenshot: Vercel backend project]`
- `[Screenshot: login against cloud API]`

---

## 4. Frontend (Netlify)

### Project settings

| Setting | Value |
|---------|--------|
| Base directory | repo root (uses [`netlify.toml`](../netlify.toml)) |
| Build command | `npm run build:frontend` |
| Publish directory | `frontend/dist` |
| Node | 20 |

### Build environment variables

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://YOUR-BACKEND.vercel.app` |
| `VITE_APPOINTMENT_URL` | `https://YOUR-APPOINTMENT.vercel.app` |

Vite bakes these in at **build** time — redeploy the frontend after changing them.

### Deploy (CLI)

```bash
npx netlify login
npx netlify init   # or link existing site
npx netlify env:set VITE_API_URL https://YOUR-BACKEND.vercel.app
npx netlify env:set VITE_APPOINTMENT_URL https://YOUR-APPOINTMENT.vercel.app
npx netlify deploy --prod --build
```

### After Netlify URL is known

Update `CORS_ORIGINS` on **both** Vercel projects to the exact Netlify origin (e.g. `https://something.netlify.app`), then redeploy both APIs (or trigger env refresh).

### Verify

1. Open `https://YOUR_SITE.netlify.app/login` (HTTPS).
2. Login with seeded admin.
3. Confirm dashboard appointment counts are non-zero (backend → appointment service).
4. Create/update a patient in one browser session; confirm the other session refreshes within ~15s (React Query polling).

- `[Screenshot: Netlify build settings]`
- `[Screenshot: Netlify env vars]`
- `[Screenshot: login + dashboard]`

---

## Environment matrix (summary)

| Variable | Backend | Appointment | Netlify (build) |
|----------|---------|-------------|-----------------|
| `NODE_ENV` | production | production | — |
| `JWT_SECRET` | shared | shared | — |
| `JWT_EXPIRES_IN` | yes | — | — |
| `MONGODB_URI` | Atlas | Atlas | — |
| `APPOINTMENT_SERVICE_URL` | appointment HTTPS URL | — | — |
| `CORS_ORIGINS` | Netlify origin | Netlify origin | — |
| `VITE_API_URL` | — | — | backend HTTPS URL |
| `VITE_APPOINTMENT_URL` | — | — | appointment HTTPS URL |

---

## Security checklist

- [ ] Strong unique `JWT_SECRET` (never the example value)
- [ ] Atlas user password is not reused elsewhere
- [ ] CORS allowlist is the Netlify origin only (no `*`)
- [ ] Secrets only in provider dashboards / CLI env — never committed
- [ ] HTTPS everywhere (Netlify + Vercel default certificates)
- [ ] Seed credentials rotated or disabled after demos

---

## Rollback

| Layer | Action |
|-------|--------|
| Netlify | Deploys → Publish a previous successful deploy |
| Vercel | Deployments → Promote previous production deployment |
| Atlas | Restore from backup / snapshot if data corrupted |
| Config | Revert env vars and redeploy affected services |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| CORS browser errors | Netlify origin missing from `CORS_ORIGINS` | Set exact origin on both APIs; redeploy |
| `401` on appointments | JWT secrets differ | Align `JWT_SECRET` on both Vercel projects |
| Dashboard appointment stats `0` / errors | Wrong `APPOINTMENT_SERVICE_URL` | Use appointment production URL, no trailing slash |
| Frontend still hits localhost | Stale Vite build | Set `VITE_*` in Netlify and **rebuild** |
| Mongo network timeout | Atlas IP access | Allow `0.0.0.0/0` or correct egress IPs |
| Vercel `FUNCTION_INVOCATION_FAILED` | Missing env or DB connect | Check logs; verify `MONGODB_URI` / `JWT_SECRET` |
| Cold start latency | Serverless + Mongo | First request reconnects; subsequent reuse warm connection |

---

## Related docs

- [API Documentation](./API.md)
- [README — local Docker / Kubernetes](../README.md)
