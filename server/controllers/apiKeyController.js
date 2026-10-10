const crypto = require('crypto');
const prisma = require('../prismaClient');

// Get all API keys for the authenticated user
exports.getKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true
      }
    });

    res.status(200).json(keys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

// Generate a new API key
exports.createKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const keyLabel = (name && name.trim()) || 'Production Pipeline Key';

    // Generate cryptographically secure random API key: rzl_live_<32 hex chars>
    const randomHex = crypto.randomBytes(16).toString('hex');
    const fullKey = `rzl_live_${randomHex}`;
    const last4 = randomHex.slice(-4);
    const keyPrefix = `rzl_live_••••••••${last4}`;

    const newApiKey = await prisma.apiKey.create({
      data: {
        name: keyLabel,
        key: fullKey,
        keyPrefix: keyPrefix,
        userId: userId
      }
    });

    res.status(201).json({
      message: 'API Key generated successfully',
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: fullKey, // Return full key once so user can copy it
        keyPrefix: newApiKey.keyPrefix,
        createdAt: newApiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
};

// Revoke/delete an API key
exports.revokeKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existing = await prisma.apiKey.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'API key not found or already deleted' });
    }

    await prisma.apiKey.delete({
      where: { id }
    });

    res.status(200).json({ message: 'API key revoked successfully', id });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};
