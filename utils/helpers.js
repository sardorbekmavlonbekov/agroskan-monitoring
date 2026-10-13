const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const assertObjectId = (id, label = 'ID') => {
  if (!mongoose.isValidObjectId(id)) throw new AppError(`${label} noto'g'ri formatda`, 400);
};

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// USER -> faqat o'zining ma'lumotlari. ADMIN -> hammasi yoki ?userId= bo'yicha
const getScope = (req) => {
  if (req.user.role !== 'ADMIN') return { userId: req.user._id };
  const { userId } = req.query;
  if (userId) {
    assertObjectId(userId, 'userId');
    return { userId };
  }
  return {};
};

module.exports = { pick, parsePagination, escapeRegex, assertObjectId, signToken, getScope };
