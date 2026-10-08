const mongoose = require('mongoose');

/**
 * Kiểm tra định dạng Email
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Kiểm tra mật khẩu (tối thiểu 6 ký tự)
 */
const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

/**
 * Kiểm tra ObjectId hợp lệ của MongoDB
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Kiểm tra số dương >= 0
 */
const isNonNegativeNumber = (val) => {
  const num = Number(val);
  return !isNaN(num) && num >= 0;
};

/**
 * Kiểm tra số nguyên dương > 0
 */
const isPositiveInteger = (val) => {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidObjectId,
  isNonNegativeNumber,
  isPositiveInteger
};
