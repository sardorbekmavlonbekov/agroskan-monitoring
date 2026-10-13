const AppError = require('../utils/AppError');

// authMiddleware'dan keyin ishlatiladi
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new AppError("Bu amal faqat administrator uchun", 403));
  }
  next();
};

module.exports = adminMiddleware;
