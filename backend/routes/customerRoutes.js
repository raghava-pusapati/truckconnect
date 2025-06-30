const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { postLoad, getApplicants, assignDriver } = require('../controllers/customerController');

router.post('/post-load', authMiddleware, postLoad);
router.get('/applicants/:loadId', authMiddleware, getApplicants);
router.put('/assign/:loadId', authMiddleware, assignDriver);

module.exports = router;