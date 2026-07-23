/**
 * Self-contained stack for Playwright / Lighthouse:
 * memory Mongo → seed → backend → appointment-service → frontend preview
 */
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  FRONTEND_PORT,
  BACKEND_PORT,
  APPOINTMENT_PORT,
  JWT_SECRET,
} = require('./ports');

const ROOT = path.resolve(__dirname, '../..');
const children = [];
let memoryServer;

function log(message) {
  console.log(`[e2e-stack] ${message}`);
}

function spawnNode(scriptPath, env, label) {
  const child = spawn(process.execPath, [scriptPath], {
    cwd: path.dirname(scriptPath),
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });
  child.on('exit', (code, signal) => {
    if (code && code !== 0) {
      log(`${label} exited with code ${code}`);
      shutdown().finally(() => process.exit(code));
    } else if (signal) {
      log(`${label} exited via ${signal}`);
    }
  });
  children.push(child);
  return child;
}

function waitForUrl(url, timeoutMs = 120000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      req.on('error', retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(attempt, 500);
    };

    attempt();
  });
}

async function runSeed(mongoUri) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/seed.js'], {
      cwd: path.join(ROOT, 'backend'),
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
      },
      stdio: 'inherit',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Seed failed with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function buildFrontend(apiUrl, appointmentUrl) {
  log('Building frontend for preview…');
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'build', '--workspace=frontend'],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          VITE_API_URL: apiUrl,
          VITE_APPOINTMENT_URL: appointmentUrl,
        },
        stdio: 'inherit',
        shell: process.platform === 'win32',
      }
    );
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Frontend build failed with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function shutdown() {
  for (const child of children.splice(0).reverse()) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch {
      // ignore
    }
    memoryServer = null;
  }
}

async function main() {
  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });

  log('Starting MongoMemoryServer…');
  memoryServer = await MongoMemoryServer.create();
  const mongoUri = memoryServer.getUri('healthcare');
  log(`Mongo ready at ${mongoUri}`);

  await runSeed(mongoUri);

  const apiUrl = `http://127.0.0.1:${BACKEND_PORT}`;
  const appointmentUrl = `http://127.0.0.1:${APPOINTMENT_PORT}`;
  const frontendUrl = `http://127.0.0.1:${FRONTEND_PORT}`;

  const sharedEnv = {
    MONGODB_URI: mongoUri,
    JWT_SECRET,
    JWT_EXPIRES_IN: '8h',
    NODE_ENV: 'development',
    CORS_ORIGINS: frontendUrl,
  };

  log(`Starting backend on ${BACKEND_PORT}…`);
  spawnNode(
    path.join(ROOT, 'backend', 'server.js'),
    {
      ...sharedEnv,
      PORT: String(BACKEND_PORT),
      APPOINTMENT_SERVICE_URL: appointmentUrl,
    },
    'backend'
  );

  log(`Starting appointment-service on ${APPOINTMENT_PORT}…`);
  spawnNode(
    path.join(ROOT, 'microservices', 'appointment-service', 'server.js'),
    {
      ...sharedEnv,
      PORT: String(APPOINTMENT_PORT),
    },
    'appointment'
  );

  await waitForUrl(`${apiUrl}/health`);
  await waitForUrl(`${appointmentUrl}/health`);
  log('API health checks passed');

  await buildFrontend(apiUrl, appointmentUrl);

  log(`Starting frontend preview on ${FRONTEND_PORT}…`);
  const preview = spawn(
    process.execPath,
    [
      path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(FRONTEND_PORT),
      '--strictPort',
    ],
    {
      cwd: path.join(ROOT, 'frontend'),
      env: {
        ...process.env,
        VITE_API_URL: apiUrl,
        VITE_APPOINTMENT_URL: appointmentUrl,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  preview.stdout.on('data', (chunk) => process.stdout.write(`[frontend] ${chunk}`));
  preview.stderr.on('data', (chunk) => process.stderr.write(`[frontend] ${chunk}`));
  children.push(preview);

  await waitForUrl(`${frontendUrl}/login`);
  log(`Stack ready: ${frontendUrl}`);
  // Keep process alive for Playwright / LHCI
  await new Promise(() => {});
}

main().catch(async (err) => {
  console.error('[e2e-stack] Failed:', err);
  await shutdown();
  process.exit(1);
});
