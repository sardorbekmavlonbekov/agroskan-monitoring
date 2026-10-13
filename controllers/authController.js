const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { pick, signToken } = require('../utils/helpers');

const isStr = (v) => typeof v === 'string';

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!isStr(name) || !isStr(email) || !isStr(password)) {
    throw new AppError('Ism, email va parol majburiy', 400);
  }
  if (password.length < 8) throw new AppError("Parol kamida 8 belgidan iborat bo'lishi kerak", 400);

  // role va status foydalanuvchidan QABUL QILINMAYDI (mass-assignment himoyasi)
  const data = pick(req.body, ['name', 'email', 'password', 'phone', 'farmName', 'location', 'area']);
  const user = await User.create({ ...data, role: 'USER', status: 'ACTIVE' });

  res.status(201).json({ success: true, token: signToken(user), user });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!isStr(email) || !isStr(password)) throw new AppError('Email va parol majburiy', 400);

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Email yoki parol noto'g'ri", 401);
  }
  if (user.status === 'BLOCKED') throw new AppError('Akkauntingiz bloklangan', 403);

  res.json({ success: true, token: signToken(user), user });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});
