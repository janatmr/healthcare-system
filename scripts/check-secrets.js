#!/usr/bin/env node
/**
 * Reject tracked files that look like real secrets / env files.
 * Allows documented templates (*.example, *.sample, *.template).
 */
const { execSync } = require('child_process');
const path = require('path');

const ALLOWED_ENV_BASENAMES = new Set([
  '.env.example',
  '.env.sample',
  '.env.template',
]);

const FORBIDDEN_BASENAME = /^(?:\.env(?:\..+)?|.*\.(?:pem|p12|pfx|key))$/i;
const FORBIDDEN_PATH_PARTS = [
  /(^|\/)secrets?\//i,
  /(^|\/)credentials?\//i,
  /(^|\/)\.aws\//i,
  /(^|\/)id_rsa$/i,
  /(^|\/)id_ed25519$/i,
];

function listTrackedFiles() {
  const output = execSync('git ls-files -z', {
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return output
    .toString('utf8')
    .split('\0')
    .map((f) => f.trim())
    .filter(Boolean);
}

function isAllowedEnvTemplate(filePath) {
  const base = path.basename(filePath);
  if (ALLOWED_ENV_BASENAMES.has(base)) return true;
  // e.g. backend/.env.example already covered; also allow *.env.example patterns
  return /\.env\.(example|sample|template)$/i.test(base);
}

function isForbidden(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const base = path.basename(normalized);

  if (FORBIDDEN_BASENAME.test(base) && !isAllowedEnvTemplate(normalized)) {
    return `secret/env file: ${normalized}`;
  }

  for (const re of FORBIDDEN_PATH_PARTS) {
    if (re.test(normalized)) {
      return `credential path: ${normalized}`;
    }
  }

  return null;
}

function main() {
  let files;
  try {
    files = listTrackedFiles();
  } catch (err) {
    console.error('check-secrets: unable to list git-tracked files.');
    console.error(err.message || err);
    process.exit(1);
  }

  const violations = [];
  for (const file of files) {
    const reason = isForbidden(file);
    if (reason) violations.push(reason);
  }

  if (violations.length) {
    console.error('check-secrets: refusing to proceed — tracked secret-like files found:\n');
    for (const v of violations) console.error(`  - ${v}`);
    console.error('\nRemove these files from git (keep only *.env.example templates).');
    process.exit(1);
  }

  console.log('check-secrets: OK (no tracked secret/env credential files).');
}

main();
