const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', queryController.getQueries);
router.post('/', queryController.createQuery);
router.put('/:id', queryController.updateQuery);
router.delete('/:id', queryController.deleteQuery);

module.exports = router;
