const prisma = require('../prismaClient');

// Helper to log activities across backend controllers
exports.logActivity = async ({ message, type = 'general', status = 'success', userId }) => {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) targetUserId = defaultUser.id;
    }
    if (!targetUserId) return;

    await prisma.activity.create({
      data: {
        message,
        type,
        status,
        userId: targetUserId
      }
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// Seed real activities from existing DB records if activity table is empty
async function seedActivitiesIfEmpty() {
  try {
    const count = await prisma.activity.count();
    if (count > 0) return;

    const user = await prisma.user.findFirst();
    if (!user) return;

    const datasets = await prisma.dataset.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
    const dataSources = await prisma.dataSource.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
    const queries = await prisma.savedQuery.findMany({ take: 10, orderBy: { lastRunAt: 'desc' } });

    const activitiesToCreate = [];

    for (const ds of dataSources) {
      activitiesToCreate.push({
        message: `Connected data source "${ds.name}" (${ds.type || 'DB'})`,
        type: 'connect',
        status: 'success',
        userId: user.id,
        createdAt: ds.createdAt || new Date()
      });
    }

    for (const ds of datasets) {
      activitiesToCreate.push({
        message: `Uploaded dataset "${ds.name}" (${ds.rowCount || 0} rows)`,
        type: 'upload',
        status: ds.status === 'Ready' ? 'success' : ds.status === 'Failed' ? 'error' : 'pending',
        userId: user.id,
        createdAt: ds.createdAt || new Date()
      });
    }

    for (const q of queries) {
      activitiesToCreate.push({
        message: `Saved SQL query "${q.name}"`,
        type: 'query',
        status: 'success',
        userId: user.id,
        createdAt: q.lastRunAt || new Date()
      });
    }

    if (activitiesToCreate.length > 0) {
      for (const act of activitiesToCreate) {
        await prisma.activity.create({ data: act });
      }
    }
  } catch (err) {
    console.error('Error seeding initial activities:', err);
  }
}

// Controller to get all real system activities
exports.getActivities = async (req, res) => {
  try {
    await seedActivitiesIfEmpty();

    const activities = await prisma.activity.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.status(200).json(activities);
  } catch (error) {
    console.error('Get Activities Error:', error);
    res.status(200).json([]);
  }
};
