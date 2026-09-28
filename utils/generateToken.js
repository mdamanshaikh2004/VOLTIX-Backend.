const jwt = require('jsonwebtoken');

// Signs a JWT containing only the minimum needed to identify the user.
// Never put passwords or other sensitive data in the token payload.
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
