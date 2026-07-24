# syntax=docker/dockerfile:1
# Frontend — Vite production build + unprivileged NGINX (build from monorepo root)
# docker build -f frontend/Dockerfile \
#   --build-arg VITE_API_URL=http://localhost:5000 \
#   --build-arg VITE_APPOINTMENT_URL=http://localhost:5001 \
#   -t healthcare-frontend .

FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:5000
ARG VITE_APPOINTMENT_URL=http://localhost:5001
ENV VITE_API_URL=$VITE_API_URL \
    VITE_APPOINTMENT_URL=$VITE_APPOINTMENT_URL

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY microservices/appointment-service/package.json ./microservices/appointment-service/

RUN npm ci --workspace=frontend

COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
