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

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback to cookies if no Authorization header or token
    if (!token && req.cookies) {
      token = req.cookies.token || req.cookies.accessToken || null;
    }

    const refreshToken = req.cookies ? req.cookies.refreshToken : null;

    // If no access token at all, try refresh token directly
    if (!token) {
      if (!refreshToken) {
        return res
          .status(401)
          .json({ success: false, message: 'Authorization token missing or invalid' });
      }

      // Verify refresh token and issue new access token
      try {
        const refreshPayload = jwt.verify(refreshToken, process.env.JWT_SECRET);

        const newAccessToken = jwt.sign(
          {
            id: refreshPayload.id,
            username: refreshPayload.username,
            email: refreshPayload.email,
            role: refreshPayload.role
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
        );

        // Set new access token cookie
        res.cookie('token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: (process.env.JWT_ACCESS_MAXAGE_MINUTES
            ? Number(process.env.JWT_ACCESS_MAXAGE_MINUTES) * 60 * 1000
            : 15 * 60 * 1000)
        });

        req.user = refreshPayload;
        return next();
      } catch (err) {
        console.error('Refresh token validation error:', err);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    }

    // We have an access token (from header or cookie); verify it
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // If access token expired, attempt to use refresh token
      if (err.name === 'TokenExpiredError' && refreshToken) {
        try {
          const refreshPayload = jwt.verify(refreshToken, process.env.JWT_SECRET);

          const newAccessToken = jwt.sign(
            {
              id: refreshPayload.id,
              username: refreshPayload.username,
              email: refreshPayload.email,
              role: refreshPayload.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
          );

          res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: (process.env.JWT_ACCESS_MAXAGE_MINUTES
              ? Number(process.env.JWT_ACCESS_MAXAGE_MINUTES) * 60 * 1000
              : 15 * 60 * 1000)
          });

          req.user = refreshPayload;
          return next();
        } catch (refreshErr) {
          console.error('Refresh token validation error:', refreshErr);
          return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
      }

      console.error('JWT validation error:', err);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  } catch (err) {
    console.error('JWT validation error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
