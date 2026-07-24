# syntax=docker/dockerfile:1
# Appointment microservice — reproducible production image (build from monorepo root)
# docker build -f microservices/appointment-service/Dockerfile -t healthcare-appointment .

FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY microservices/appointment-service/package.json ./microservices/appointment-service/

RUN npm ci --workspace=appointment-service --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5001

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --from=deps --chown=app:app /app/package.json ./package.json
COPY --from=deps --chown=app:app /app/microservices/appointment-service/package.json ./microservices/appointment-service/package.json
COPY --chown=app:app microservices/appointment-service/ ./microservices/appointment-service/

USER app
WORKDIR /app/microservices/appointment-service

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
