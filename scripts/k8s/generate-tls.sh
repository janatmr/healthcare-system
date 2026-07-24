#!/usr/bin/env bash
# Generate a self-signed cert for hospital.local and create Secret hospital-tls.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CERT_DIR="${ROOT_DIR}/infra/k8s/certs"
CRT="${CERT_DIR}/hospital.crt"
KEY="${CERT_DIR}/hospital.key"
NAMESPACE="${NAMESPACE:-healthcare}"
SECRET_NAME="${SECRET_NAME:-hospital-tls}"

mkdir -p "${CERT_DIR}"
# Remove partial leftovers from interrupted runs
rm -f "${KEY}" "${CRT}"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate hospital.local certificates." >&2
  exit 1
fi

echo "Generating self-signed certificate for hospital.local → ${CERT_DIR}"
# MSYS_NO_PATHCONV avoids Git Bash rewriting /CN=... into a Windows path
export MSYS_NO_PATHCONV=1
SUBJECT="/CN=hospital.local/O=Healthcare System/C=US"
# Write via relative paths from CERT_DIR (more reliable under Git Bash/Windows)
(
  cd "${CERT_DIR}"
  if ! openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout hospital.key \
    -out hospital.crt \
    -subj "${SUBJECT}" \
    -addext "subjectAltName=DNS:hospital.local" 2>/dev/null; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout hospital.key \
      -out hospital.crt \
      -subj "${SUBJECT}"
  fi
)

chmod 600 "${KEY}" || true
test -s "${CRT}" && test -s "${KEY}"

if ! command -v kubectl >/dev/null 2>&1; then
  echo "Certificates written. kubectl not found — skip Secret create."
  echo "  ${CRT}"
  echo "  ${KEY}"
  exit 0
fi

# Prefer Windows-native paths for kubectl on Git Bash
NS_FILE="${ROOT_DIR}/infra/k8s/namespace.yaml"
if command -v cygpath >/dev/null 2>&1; then
  NS_FILE="$(cygpath -w "${NS_FILE}")"
  CRT_K="$(cygpath -w "${CRT}")"
  KEY_K="$(cygpath -w "${KEY}")"
else
  CRT_K="${CRT}"
  KEY_K="${KEY}"
fi

# Ensure namespace exists before creating the Secret
kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1 \
  || kubectl apply -f "${NS_FILE}"

kubectl create secret tls "${SECRET_NAME}" \
  --cert="${CRT_K}" \
  --key="${KEY_K}" \
  -n "${NAMESPACE}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secret ${NAMESPACE}/${SECRET_NAME} applied."
echo "Cert files (gitignored): ${CRT} ${KEY}"
