const prisma = require('../prismaClient');

// Get all saved queries for a user
exports.getQueries = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const whereClause = userId ? { ownerId: userId } : {};
    
    const queries = await prisma.savedQuery.findMany({
      where: whereClause,
      orderBy: { lastRunAt: 'desc' }
    });
    
    res.status(200).json(queries);
  } catch (error) {
    console.error('Get Queries Error:', error);
    res.status(500).json({ error: 'Failed to fetch saved queries' });
  }
};

// Create a new saved query
exports.createQuery = async (req, res) => {
  try {
    const { name, target, sql } = req.body;
    if (!name || !target) {
      return res.status(400).json({ error: 'Name and target dataset are required' });
    }

    let userId = req.user ? req.user.id : null;
    if (!userId) {
      const user = await prisma.user.findFirst();
      if (user) userId = user.id;
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = await prisma.savedQuery.create({
      data: {
        name,
        queryConfig: { target, sql: sql || '' },
        ownerId: userId,
        lastRunAt: new Date()
      }
    });

    res.status(201).json(query);
  } catch (error) {
    console.error('Create Query Error:', error);
    res.status(500).json({ error: 'Failed to save query' });
  }
};

// Update a saved query
exports.updateQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, target, sql } = req.body;

    const existing = await prisma.savedQuery.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Query not found' });

    const updatedConfig = {
      ...(existing.queryConfig || {}),
      target: target !== undefined ? target : existing.queryConfig?.target,
      sql: sql !== undefined ? sql : existing.queryConfig?.sql
    };

    const updated = await prisma.savedQuery.update({
      where: { id },
      data: {
        name: name || existing.name,
        queryConfig: updatedConfig,
        lastRunAt: new Date()
      }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update Query Error:', error);
    res.status(500).json({ error: 'Failed to update query' });
  }
};

// Delete a saved query
exports.deleteQuery = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.savedQuery.delete({ where: { id } });
    res.status(200).json({ message: 'Query deleted successfully' });
  } catch (error) {
    console.error('Delete Query Error:', error);
    res.status(500).json({ error: 'Failed to delete query' });
  }
};
