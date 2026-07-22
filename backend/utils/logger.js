/**
 * Centralized application logger.
 * Never logs passwords, JWT tokens, or patient sensitive data.
 */

const LEVELS = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};

function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${LEVELS[level]}] ${message}`;

  if (meta === undefined) {
    return base;
  }

  // Avoid dumping raw objects that may contain secrets; only allow safe keys
  if (typeof meta === 'object' && meta !== null) {
    const safe = sanitizeMeta(meta);
    return Object.keys(safe).length > 0
      ? `${base} ${JSON.stringify(safe)}`
      : base;
  }

  return `${base} ${String(meta)}`;
}

function sanitizeMeta(meta) {
  const blocked = new Set([
    'password',
    'token',
    'authorization',
    'jwt',
    'secret',
    'email',
    'phone',
    'address',
    'firstName',
    'lastName',
    'dateOfBirth',
  ]);

  const result = {};

  for (const [key, value] of Object.entries(meta)) {
    if (blocked.has(key.toLowerCase())) {
      continue;
    }
    if (key.toLowerCase() === 'stack' && process.env.NODE_ENV === 'production') {
      continue;
    }
    result[key] = value;
  }

  return result;
}

const logger = {
  info(message, meta) {
    console.log(formatMessage('info', message, meta));
  },

  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },

  error(message, meta) {
    console.error(formatMessage('error', message, meta));
  },
};

module.exports = logger;
