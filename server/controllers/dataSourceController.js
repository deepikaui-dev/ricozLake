const prisma = require('../prismaClient');
const { logActivity } = require('./activityController');

// Get all data sources for a user
exports.getDataSources = async (req, res) => {
  try {
    const dataSources = await prisma.dataSource.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(dataSources);
  } catch (error) {
    console.error('Get DataSources Error:', error);
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
};

// Create a new data source
exports.createDataSource = async (req, res) => {
  try {
    const { name, type, host, port, database, username, password } = req.body;

    if (!name || !host) {
      return res.status(400).json({ error: 'Name and host are required' });
    }

    const newDataSource = await prisma.dataSource.create({
      data: {
        name,
        type: type || 'Relational DB',
        host,
        port: port ? parseInt(port) : null,
        database,
        username,
        password,
        ownerId: req.user.id,
      },
    });

    await logActivity({
      message: `Connected new data source "${newDataSource.name}" (${newDataSource.type || 'DB'})`,
      type: 'connect',
      status: 'success',
      userId: req.user.id
    });

    res.status(201).json({ message: 'Data source created successfully', dataSource: newDataSource });
  } catch (error) {
    console.error('Create DataSource Error:', error);
    res.status(500).json({ error: 'Failed to create data source' });
  }
};

// Sync data source
exports.syncDataSource = async (req, res) => {
  try {
    const { id } = req.params;

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    });

    if (!dataSource || dataSource.ownerId !== req.user.id) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    // Update last sync time
    const updated = await prisma.dataSource.update({
      where: { id },
      data: { lastSync: new Date() },
    });

    await logActivity({
      message: `Synced data source "${updated.name}"`,
      type: 'sync',
      status: 'success',
      userId: req.user.id
    });

    res.status(200).json({ message: 'Sync successful', dataSource: updated });
  } catch (error) {
    console.error('Sync DataSource Error:', error);
    res.status(500).json({ error: 'Failed to sync data source' });
  }
};
