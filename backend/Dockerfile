# syntax=docker/dockerfile:1
# Backend API — reproducible production image (build from monorepo root)
# docker build -f backend/Dockerfile -t healthcare-backend .

FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY microservices/appointment-service/package.json ./microservices/appointment-service/

RUN npm ci --workspace=backend --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --from=deps --chown=app:app /app/package.json ./package.json
COPY --from=deps --chown=app:app /app/backend/package.json ./backend/package.json
COPY --chown=app:app backend/ ./backend/

USER app
WORKDIR /app/backend

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
