'use strict';

const express = require('express');
const { toggleLike } = require('../controllers/likeController');

const router = express.Router();

router.post('/', toggleLike);

module.exports = router;
