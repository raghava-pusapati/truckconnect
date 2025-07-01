const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getAvailableLoads, applyToLoad } = require('../controllers/driverController');

router.get('/loads', authMiddleware, getAvailableLoads);
router.post('/apply/:loadId', authMiddleware, applyToLoad);

module.exports = router;