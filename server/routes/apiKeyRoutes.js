const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const { protect } = require('../middlewares/authMiddleware');

// All API key management routes require user authentication
router.use(protect);

router.get('/', apiKeyController.getKeys);
router.post('/', apiKeyController.createKey);
router.delete('/:id', apiKeyController.revokeKey);

module.exports = router;
