// Must run AFTER `protect`, since it relies on req.user being set.
// The frontend never decides who is an admin — this check is authoritative.
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
  }
  next();
};

module.exports = { adminOnly };
