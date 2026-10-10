const express = require('express');
const router = express.Router();
const multer = require('multer');
const datasetController = require('../controllers/datasetController');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.get('/', datasetController.getAllDatasets);
router.get('/:id', datasetController.getDatasetById);
router.get('/:id/download', datasetController.downloadDataset);
router.get('/:id/preview', datasetController.getDatasetPreview);
router.post('/', upload.single('file'), datasetController.uploadDataset);
router.patch('/:id/zone', datasetController.updateDatasetZone);
router.patch('/:id/partition', datasetController.updateDatasetPartition);
router.delete('/:id', datasetController.deleteDataset);

module.exports = router;
