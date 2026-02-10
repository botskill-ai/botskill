const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = { userId: decoded.userId, role: decoded.role || 'user' };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Role ${roles.join(' or ')} required.` });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  authorizeRole
};