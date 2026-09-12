'use strict';

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();


app.set('trust proxy', 1);
app.disable('x-powered-by');

const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin / tooling requests that send no Origin header (curl, Postman).
    if (!origin) return callback(null, true);
    if (env.clientOrigins.includes('*') || env.clientOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new ApiError(403, `Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

if (!env.isTest) {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`);
    });
    next();
  });
}

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Socially Approved Video Carousel API',
      endpoints: ['GET /api/health', 'GET /api/videos', 'GET /api/videos/:id', 'POST /api/like', 'POST /api/share'],
    },
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
