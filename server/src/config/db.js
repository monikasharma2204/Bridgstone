'use strict';

const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);


async function connectDB(uri = env.mongoUri) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to server/.env.');
  }

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });

  const { host, port, name } = mongoose.connection;
  console.log(`[mongo] connected to ${host}:${port}/${name}`);

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
