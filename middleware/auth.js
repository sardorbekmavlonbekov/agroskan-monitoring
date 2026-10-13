const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// JWT tokenni tekshiradi, foydalanuvchini DB'dan oladi (bloklangan bo'lsa kirishga ruxsat bermaydi)
const authMiddleware = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new AppError('Avtorizatsiya talab qilinadi', 401);

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError(
      err.name === 'TokenExpiredError' ? 'Token muddati tugagan' : "Token yaroqsiz",
      401
    );
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 401);
  if (user.status === 'BLOCKED') throw new AppError('Akkauntingiz bloklangan', 403);

  req.user = user;
  next();
});

module.exports = authMiddleware;
