'use strict';

const express = require('express');
const { trackShare } = require('../controllers/shareController');

const router = express.Router();

router.post('/', trackShare);

module.exports = router;
