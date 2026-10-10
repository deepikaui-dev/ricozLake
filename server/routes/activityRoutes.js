const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

// Optional protect middleware or open route for fetching logs
router.get('/', activityController.getActivities);

module.exports = router;
