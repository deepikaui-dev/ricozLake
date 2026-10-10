const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-me-in-production';

exports.protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check for API key in header (x-api-key or apiKey query/header)
    const rawApiKey = req.headers['x-api-key'] || req.headers['api-key'];
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if the bearer token is actually an API key (rzl_live_...)
    const apiKeyToValidate = rawApiKey || (token && token.startsWith('rzl_live_') ? token : null);

    if (apiKeyToValidate) {
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyToValidate },
        include: { user: { select: { id: true, email: true, name: true } } }
      });

      if (!keyRecord) {
        return res.status(401).json({ error: 'Invalid or revoked API Key' });
      }

      // Update lastUsedAt timestamp asynchronously
      prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() }
      }).catch(err => console.error('Failed to update API key lastUsedAt:', err.message));

      req.user = {
        id: keyRecord.userId,
        email: keyRecord.user?.email,
        name: keyRecord.user?.name,
        isApiKey: true,
        apiKeyId: keyRecord.id
      };

      return next();
    }

    // 2. Otherwise handle JWT Token
    if (!token) {
      return res.status(401).json({ error: 'Not authorized. Please provide a valid token or API Key.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId || decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

