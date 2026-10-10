const prisma = require('../prismaClient');
const fs = require('fs');
const csv = require('csv-parser');
const { logActivity } = require('./activityController');

exports.getAllDatasets = async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      include: { tags: true, quality: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(datasets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
};

exports.getDatasetById = async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: req.params.id },
      include: { tags: true, quality: true, versions: true }
    });
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    res.status(200).json(dataset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
};

exports.downloadDataset = async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const path = require('path');
    const filePath = path.resolve(dataset.fileUrl);
    const format = req.query.format || 'csv';
    
    // Express res.download forces the browser to download the file instead of opening it
    res.download(filePath, `${dataset.name}.${format}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download dataset' });
  }
};

exports.getDatasetPreview = async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const path = require('path');
    const filePath = path.resolve(dataset.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 500;

    if (filePath.endsWith('.csv')) {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          if (results.length < limit) results.push(data);
        })
        .on('end', () => {
          res.status(200).json({ preview: results, total: results.length });
        })
        .on('error', (err) => {
          res.status(500).json({ error: 'Failed to parse CSV' });
        });
    } else if (filePath.endsWith('.json')) {
      const fileData = await fs.promises.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(fileData);
      
      let records = [];
      if (Array.isArray(parsedData)) {
        records = parsedData;
      } else if (typeof parsedData === 'object') {
        const arrayProp = Object.values(parsedData).find(val => Array.isArray(val));
        records = arrayProp ? arrayProp : [parsedData];
      }
      
      res.status(200).json({ preview: records.slice(0, limit), total: records.length });
    } else {
      res.status(400).json({ error: 'Unsupported file format for preview' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
};

exports.deleteDataset = async (req, res) => {
  try {
    const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id } });
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    // Optional: Delete the file from the filesystem if you want
    if (dataset.fileUrl && fs.existsSync(dataset.fileUrl)) {
      fs.unlinkSync(dataset.fileUrl);
    }

    await prisma.dataset.delete({ where: { id: req.params.id } });

    await logActivity({
      message: `Deleted dataset "${dataset.name}"`,
      type: 'delete',
      status: 'success',
      userId: dataset.ownerId
    });

    res.status(200).json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
};

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, description, ownerId, zone, partitionKey } = req.body;
    
    // We need a dummy owner for MVP if auth isn't wired up
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@ricozlake.com',
          password: 'hashedpassword',
          name: 'Admin User'
        }
      });
    }

    const initialTags = [
      { name: `zone:${zone || 'Bronze (Raw)'}` }
    ];
    if (partitionKey && partitionKey !== 'None') {
      initialTags.push({ name: `partition:${partitionKey}` });
    }

    // Initialize dataset record in DB as 'Processing'
    const dataset = await prisma.dataset.create({
      data: {
        name: name || req.file.originalname,
        description: description || '',
        fileUrl: req.file.path,
        fileType: req.file.mimetype === 'text/csv' ? 'CSV' : 'JSON',
        sizeBytes: req.file.size,
        rowCount: 0,
        colCount: 0,
        status: 'Processing',
        ownerId: user.id,
        tags: {
          create: initialTags
        }
      },
      include: {
        tags: true
      }
    });

    // Fire off async processing (mock parse for MVP)
    processDataset(dataset.id, req.file.path);

    res.status(201).json({ 
      message: 'Dataset uploaded and processing started',
      dataset 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload dataset' });
  }
};

async function processDataset(datasetId, filePath) {
  let rowCount = 0;
  let colCount = 0;
  let missingValuesCount = 0;
  let totalCells = 0;

  try {
    // Only parsing CSV for MVP
    if (filePath.endsWith('.csv')) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (headers) => {
            colCount = headers.length;
          })
          .on('data', (data) => {
            rowCount++;
            // Basic missing value detection
            Object.values(data).forEach(val => {
              totalCells++;
              if (!val || val.trim() === '') missingValuesCount++;
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      // Parse JSON dynamically
      const fileData = await fs.promises.readFile(filePath, 'utf8');
      let parsedData = JSON.parse(fileData);
      
      let records = [];
      if (Array.isArray(parsedData)) {
        records = parsedData;
      } else if (typeof parsedData === 'object') {
        const arrayProp = Object.values(parsedData).find(val => Array.isArray(val));
        records = arrayProp ? arrayProp : [parsedData];
      }
      
      rowCount = records.length;
      if (rowCount > 0) {
        const keys = new Set();
        records.forEach(record => {
          if (record && typeof record === 'object') {
            Object.keys(record).forEach(k => keys.add(k));
          }
        });
        colCount = keys.size;
        
        records.forEach(record => {
          if (record && typeof record === 'object') {
            keys.forEach(k => {
              totalCells++;
              const val = record[k];
              if (val === null || val === undefined || val === '') missingValuesCount++;
            });
          }
        });
      }
    }

    const missingPercentage = totalCells > 0 ? (missingValuesCount / totalCells) * 100 : 0;
    const score = 100 - missingPercentage;

    // Update dataset status
    const updatedDataset = await prisma.dataset.update({
      where: { id: datasetId },
      data: {
        rowCount,
        colCount,
        status: 'Ready'
      }
    });

    // Create Quality metrics
    await prisma.dataQuality.create({
      data: {
        datasetId: datasetId,
        score: parseFloat(score.toFixed(1)),
        missingValues: parseFloat(missingPercentage.toFixed(1)),
        duplicateRows: 0 // Mock for now
      }
    });

    // Create a Version
    await prisma.datasetVersion.create({
      data: {
        datasetId: datasetId,
        versionNumber: 1,
        fileUrl: filePath,
        description: 'Initial import'
      }
    });

    await logActivity({
      message: `Uploaded dataset "${updatedDataset.name}" (${rowCount.toLocaleString()} rows)`,
      type: 'upload',
      status: 'success',
      userId: updatedDataset.ownerId
    });

  } catch (error) {
    console.error(`Failed to process dataset ${datasetId}:`, error);
    const failedDataset = await prisma.dataset.update({
      where: { id: datasetId },
      data: { status: 'Failed' }
    });

    await logActivity({
      message: `Failed to process dataset "${failedDataset.name}"`,
      type: 'upload',
      status: 'error',
      userId: failedDataset.ownerId
    });
  }
}

exports.updateDatasetZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { zone } = req.body;
    if (!zone) return res.status(400).json({ error: 'Storage zone is required' });

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: { tags: true }
    });
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    // Remove existing zone tag
    await prisma.datasetTag.deleteMany({
      where: {
        datasetId: id,
        name: { startsWith: 'zone:' }
      }
    });

    // Add new zone tag
    const newTag = await prisma.datasetTag.create({
      data: {
        datasetId: id,
        name: `zone:${zone}`
      }
    });

    await logActivity({
      message: `Promoted dataset "${dataset.name}" to ${zone} storage zone`,
      type: 'update',
      status: 'success',
      userId: dataset.ownerId
    });

    res.status(200).json({ message: `Dataset storage zone promoted to ${zone}`, zone, tag: newTag });
  } catch (error) {
    console.error('Update Zone Error:', error);
    res.status(500).json({ error: 'Failed to update dataset storage zone' });
  }
};

exports.updateDatasetPartition = async (req, res) => {
  try {
    const { id } = req.params;
    const { partitionKey } = req.body;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: { tags: true }
    });
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    // Remove existing partition tag
    await prisma.datasetTag.deleteMany({
      where: {
        datasetId: id,
        name: { startsWith: 'partition:' }
      }
    });

    let newTag = null;
    if (partitionKey && partitionKey !== 'None') {
      newTag = await prisma.datasetTag.create({
        data: {
          datasetId: id,
          name: `partition:${partitionKey}`
        }
      });
    }

    await logActivity({
      message: `Configured partition strategy for "${dataset.name}": [${partitionKey || 'None'}]`,
      type: 'update',
      status: 'success',
      userId: dataset.ownerId
    });

    res.status(200).json({ message: 'Partition strategy updated successfully', partitionKey, tag: newTag });
  } catch (error) {
    console.error('Update Partition Error:', error);
    res.status(500).json({ error: 'Failed to update partition configuration' });
  }
};
