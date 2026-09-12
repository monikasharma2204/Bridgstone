'use strict';

const express = require('express');
const mongoose = require('mongoose');

const videoRoutes = require('./videoRoutes');
const likeRoutes = require('./likeRoutes');
const shareRoutes = require('./shareRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      db: states[mongoose.connection.readyState] || 'unknown',
    },
  });
});

router.use('/videos', videoRoutes);
router.use('/like', likeRoutes);
router.use('/share', shareRoutes);

module.exports = router;
