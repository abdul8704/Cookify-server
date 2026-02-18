const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  // Allow login and register without token
  if (
    req.method === 'POST' &&
    (req.path === '/api/auth/login' || req.path === '/api/auth/register')
  ) {
    return next();
  }

  // Allow preflight CORS
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded payload to request for downstream handlers
    req.user = decoded;
    return next();
  } catch (err) {
    console.error('JWT validation error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
