const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { pick, parsePagination, assertObjectId, getScope } = require('../utils/helpers');

/**
 * Umumiy CRUD generatori.
 *  - USER: faqat o'z yozuvlari (userId bo'yicha)
 *  - ADMIN: hamma yozuvlar yoki ?userId=<id> bilan bitta fermernikini ko'radi/boshqaradi;
 *           yaratishda body.userId bilan fermer nomidan yozuv qo'shishi mumkin
 */
module.exports = ({ Model, fields, filters = [], sort, dateField }) => {
  const ownerScope = (req) => (req.user.role === 'ADMIN' ? {} : { userId: req.user._id });

  const getAll = asyncHandler(async (req, res) => {
    const filter = getScope(req);
    const { page, limit, skip } = parsePagination(req.query);

    // Ruxsat etilgan filtrlar (faqat string qiymatlar)
    filters.forEach((key) => {
      if (typeof req.query[key] === 'string' && req.query[key] !== '') filter[key] = req.query[key];
    });

    // Sana oralig'i: ?from=2026-01-01&to=2026-12-31
    if (dateField && (req.query.from || req.query.to)) {
      filter[dateField] = {};
      if (req.query.from) {
        const d = new Date(req.query.from);
        if (isNaN(d)) throw new AppError("'from' sanasi noto'g'ri", 400);
        filter[dateField].$gte = d;
      }
      if (req.query.to) {
        const d = new Date(req.query.to);
        if (isNaN(d)) throw new AppError("'to' sanasi noto'g'ri", 400);
        filter[dateField].$lte = d;
      }
    }

    const [items, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  });

  const getOne = asyncHandler(async (req, res) => {
    assertObjectId(req.params.id);
    const item = await Model.findOne({ _id: req.params.id, ...ownerScope(req) });
    if (!item) throw new AppError('Yozuv topilmadi', 404);
    res.json({ success: true, data: item });
  });

  const create = asyncHandler(async (req, res) => {
    const data = pick(req.body, fields);
    let userId = req.user._id;

    if (req.user.role === 'ADMIN' && req.body.userId) {
      assertObjectId(req.body.userId, 'userId');
      const target = await User.exists({ _id: req.body.userId });
      if (!target) throw new AppError('Fermer topilmadi', 404);
      userId = req.body.userId;
    }

    const item = await Model.create({ ...data, userId });
    res.status(201).json({ success: true, data: item });
  });

  const update = asyncHandler(async (req, res) => {
    assertObjectId(req.params.id);
    const data = pick(req.body, fields); // userId o'zgartirib bo'lmaydi
    if (Object.keys(data).length === 0) throw new AppError("Yangilash uchun ma'lumot yuborilmadi", 400);

    const item = await Model.findOneAndUpdate({ _id: req.params.id, ...ownerScope(req) }, data, {
      new: true,
      runValidators: true,
    });
    if (!item) throw new AppError('Yozuv topilmadi', 404);
    res.json({ success: true, data: item });
  });

  const remove = asyncHandler(async (req, res) => {
    assertObjectId(req.params.id);
    const item = await Model.findOneAndDelete({ _id: req.params.id, ...ownerScope(req) });
    if (!item) throw new AppError('Yozuv topilmadi', 404);
    res.json({ success: true, message: "Yozuv o'chirildi" });
  });

  return { getAll, getOne, create, update, remove };
};
