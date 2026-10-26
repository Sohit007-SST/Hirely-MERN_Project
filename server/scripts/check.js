// CI smoke check (Session 16): every module loads without a database connection
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-check-secret';

const { app, allowedOrigins } = require('../src/app');
const { initSocket, getIO, isOnline } = require('../src/socket');
const registerListeners = require('../src/events/listeners');

const checks = [
  ['express app', typeof app === 'function'],
  ['allowed origins', Array.isArray(allowedOrigins) && allowedOrigins.length > 0],
  ['socket exports', [initSocket, getIO, isOnline].every((fn) => typeof fn === 'function')],
  ['listeners export', typeof registerListeners === 'function'],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('All checks passed');
process.exit(0);
