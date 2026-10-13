const User = require('../models/User');
const Log = require('../models/Log');
const Calendar = require('../models/Calendar');
const Expense = require('../models/Expense');
const Archive = require('../models/Archive');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, escapeRegex, assertObjectId } = require('../utils/helpers');
const mongoose = require('mongoose');

// GET /api/admin/users?page=1&limit=20&search=ali&status=ACTIVE
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { role: 'USER' };

  if (['ACTIVE', 'BLOCKED'].includes(req.query.status)) filter.status = req.query.status;

  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const rx = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { farmName: rx }, { phone: rx }, { location: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/admin/users/:id  -> fermerning to'liq statistikasi va ma'lumotlari
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  assertObjectId(id);

  const user = await User.findById(id);
  if (!user) throw new AppError('Fermer topilmadi', 404);

  const uid = new mongoose.Types.ObjectId(id);
  const LIMIT = 100; // har bir modul uchun oxirgi 100 ta yozuv (to'liq ro'yxat: /api/<modul>?userId=<id>&page=)

  const [logs, calendar, expenses, archive, counts, expenseAgg, calendarAgg] = await Promise.all([
    Log.find({ userId: id }).sort({ date: -1 }).limit(LIMIT).lean(),
    Calendar.find({ userId: id }).sort({ date: -1 }).limit(LIMIT).lean(),
    Expense.find({ userId: id }).sort({ date: -1 }).limit(LIMIT).lean(),
    Archive.find({ userId: id }).sort({ year: -1 }).limit(LIMIT).lean(),
    Promise.all([
      Log.countDocuments({ userId: id }),
      Calendar.countDocuments({ userId: id }),
      Expense.countDocuments({ userId: id }),
      Archive.countDocuments({ userId: id }),
    ]),
    Expense.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    Calendar.aggregate([{ $match: { userId: uid } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const totalExpenses = expenseAgg.reduce((s, e) => s + e.total, 0);

  res.json({
    success: true,
    user,
    stats: {
      logsCount: counts[0],
      calendarCount: counts[1],
      expensesCount: counts[2],
      archiveCount: counts[3],
      totalExpenses,
      expensesByCategory: expenseAgg.map((e) => ({ category: e._id, total: e.total })),
      calendarByStatus: calendarAgg.map((c) => ({ status: c._id, count: c.count })),
    },
    data: { logs, calendar, expenses, archive },
  });
});

// PATCH /api/admin/users/:id/status   body: { status: 'BLOCKED' | 'ACTIVE' }
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  assertObjectId(id);

  if (!['ACTIVE', 'BLOCKED'].includes(status)) {
    throw new AppError("Status 'ACTIVE' yoki 'BLOCKED' bo'lishi kerak", 400);
  }
  if (String(req.user._id) === id) throw new AppError("O'zingizni bloklab bo'lmaydi", 400);

  const user = await User.findById(id);
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404);
  if (user.role === 'ADMIN') throw new AppError("Administratorning statusini o'zgartirib bo'lmaydi", 403);

  user.status = status;
  await user.save();

  res.json({
    success: true,
    message: status === 'BLOCKED' ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi',
    user,
  });
});

// GET /api/admin/analytics
exports.getAnalytics = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5, 1);
  sixMonthsAgo.setUTCHours(0, 0, 0, 0);

  const [totalUsers, activeUsers, blockedUsers, areaAgg, expenseTotalAgg, expenseByCategory, logsCount, newUsersByMonth, topCrops] =
    await Promise.all([
      User.countDocuments({ role: 'USER' }),
      User.countDocuments({ role: 'USER', status: 'ACTIVE' }),
      User.countDocuments({ role: 'USER', status: 'BLOCKED' }),
      User.aggregate([{ $match: { role: 'USER' } }, { $group: { _id: null, total: { $sum: '$area' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Log.countDocuments(),
      User.aggregate([
        { $match: { role: 'USER', createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Archive.aggregate([
        { $group: { _id: '$crop', totalYield: { $sum: '$yield' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

  res.json({
    success: true,
    analytics: {
      totalUsers,
      activeUsers,
      blockedUsers,
      totalArea: areaAgg[0]?.total || 0, // gektar
      totalExpenses: expenseTotalAgg[0]?.total || 0,
      expensesByCategory: expenseByCategory.map((e) => ({ category: e._id, total: e.total })),
      totalLogs: logsCount,
      newUsersByMonth: newUsersByMonth.map((m) => ({ year: m._id.year, month: m._id.month, count: m.count })),
      topCrops: topCrops.map((c) => ({ crop: c._id, totalYield: c.totalYield, count: c.count })),
    },
  });
});
