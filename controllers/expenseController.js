const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const crud = require('./crudFactory');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { getScope } = require('../utils/helpers');

const base = crud({
  Model: Expense,
  fields: ['category', 'amount', 'date', 'description'],
  filters: ['category'],
  sort: { date: -1 },
  dateField: 'date',
});

// GET /api/expenses/stats?year=2026  -> oylik va turkumlar bo'yicha jami sarf-xarajat
const getStats = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
  if (year < 1900 || year > 2200) throw new AppError("Yil noto'g'ri", 400);

  const scope = getScope(req);
  const match = {
    date: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) },
  };
  if (scope.userId) match.userId = new mongoose.Types.ObjectId(String(scope.userId)); // aggregate avtomatik cast qilmaydi

  const [byCategory, byMonthRaw, totalRaw] = await Promise.all([
    Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const found = byMonthRaw.find((m) => m._id === i + 1);
    return { month: i + 1, total: found ? found.total : 0, count: found ? found.count : 0 };
  });

  res.json({
    success: true,
    year,
    total: totalRaw[0]?.total || 0,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    byMonth,
  });
});

module.exports = { ...base, getStats };
