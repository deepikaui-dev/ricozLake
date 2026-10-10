const express = require('express');
const router = express.Router();
const dataSourceController = require('../controllers/dataSourceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', dataSourceController.getDataSources);
router.post('/', dataSourceController.createDataSource);
router.post('/:id/sync', dataSourceController.syncDataSource);

module.exports = router;
