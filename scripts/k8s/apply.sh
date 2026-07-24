#!/usr/bin/env bash
# Apply healthcare-system manifests to Minikube in dependency order.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
K8S_DIR="${ROOT_DIR}/infra/k8s"
NAMESPACE="${NAMESPACE:-healthcare}"

kapply() {
  local f="$1"
  if command -v cygpath >/dev/null 2>&1; then
    f="$(cygpath -w "${f}")"
  fi
  kubectl apply -f "${f}"
}

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required." >&2
  exit 1
fi

echo "==> Namespace"
kapply "${K8S_DIR}/namespace.yaml"

echo "==> ConfigMap + JWT Secret"
kapply "${K8S_DIR}/configmap.yaml"
kapply "${K8S_DIR}/app-secret.yaml"

if [[ -n "${JWT_SECRET:-}" ]]; then
  echo "==> Overriding healthcare-jwt from JWT_SECRET env"
  kubectl create secret generic healthcare-jwt \
    --from-literal=JWT_SECRET="${JWT_SECRET}" \
    -n "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

echo "==> TLS Secret (self-signed hospital.local)"
bash "${ROOT_DIR}/scripts/k8s/generate-tls.sh"

echo "==> MongoDB"
kapply "${K8S_DIR}/mongodb-pvc.yaml"
kapply "${K8S_DIR}/mongodb-deployment.yaml"
kapply "${K8S_DIR}/mongodb-service.yaml"

echo "==> Appointment service"
kapply "${K8S_DIR}/appointment-deployment.yaml"
kapply "${K8S_DIR}/appointment-service.yaml"

echo "==> Backend"
kapply "${K8S_DIR}/backend-deployment.yaml"
kapply "${K8S_DIR}/backend-service.yaml"

echo "==> Frontend"
kapply "${K8S_DIR}/frontend-deployment.yaml"
kapply "${K8S_DIR}/frontend-service.yaml"

echo "==> Ingress"
# Prefer generated TLS secret; skip documentation-only tls-secret.yaml
kapply "${K8S_DIR}/ingress.yaml"

echo "==> Waiting for workloads"
kubectl rollout status deployment/mongodb -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/appointment-service -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/backend -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/frontend -n "${NAMESPACE}" --timeout=180s

echo ""
echo "Applied. Next:"
echo "  kubectl get pods,svc,ingress,secrets -n ${NAMESPACE}"
echo "  Add hosts entry: \$(minikube ip) hospital.local"
echo "  Open https://hospital.local/login (accept self-signed cert warning)"
