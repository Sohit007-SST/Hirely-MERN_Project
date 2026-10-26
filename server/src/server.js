// Session 1 + 16: load env vars first, then boot DB -> HTTP server -> Socket.io -> listeners
require('dotenv').config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}.`);
  console.error('Copy server/.env.example to server/.env and fill them in.');
  process.exit(1);
}

const http = require('http');
const connectDB = require('./config/db');
const { app, allowedOrigins } = require('./app');
const { initSocket } = require('./socket');
const registerListeners = require('./events/listeners');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Session 1: the Node http module wraps the Express app so Socket.io can share the server
  const server = http.createServer(app);
  initSocket(server, allowedOrigins);
  registerListeners();

  server.on('error', (err) => {
    if (err.code !== 'EADDRINUSE') throw err;
    // On macOS, port 5000 is often taken by AirPlay Receiver
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a free port in server/.env`);
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`GigBazaar API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start().catch((err) => {
  console.error('Failed to start the server:', err.message);
  process.exit(1);
});
