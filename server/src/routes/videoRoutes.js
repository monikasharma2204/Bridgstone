'use strict';

const express = require('express');
const { listVideos, getVideoById } = require('../controllers/videoController');

const router = express.Router();

router.get('/', listVideos);
router.get('/:id', getVideoById);

module.exports = router;
