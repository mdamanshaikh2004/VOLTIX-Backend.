const validator = require('validator');

const isValidEmail = (email) => typeof email === 'string' && validator.isEmail(email);

// Minimum 8 chars, at least one uppercase, one lowercase, one number, one special char.
const isStrongPassword = (password) => {
  if (typeof password !== 'string') return false;
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

module.exports = { isValidEmail, isStrongPassword, isNonEmptyString };
