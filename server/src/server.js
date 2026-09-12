'use strict';

const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[startup] could not connect to MongoDB:', err.message);
    console.error('[startup] check MONGODB_URI in server/.env and make sure mongod is running.');
    process.exit(1);
  }

  server = app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] CORS allows: ${env.clientOrigins.join(', ') || '(none)'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] port ${env.port} is already in use. Set a different PORT in server/.env.`);
      process.exit(1);
    }
    throw err;
  });
}

async function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandled rejection:', reason);
});

start();
