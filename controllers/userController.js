const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { pick } = require('../utils/helpers');
const { uploadBuffer } = require('../config/cloudinary');

// GET /api/user/profile
exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/user/profile  (email, parol, role, status o'zgartirilmaydi)
exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = pick(req.body, ['name', 'phone', 'farmName', 'location', 'area']);
  if (Object.keys(updates).length === 0) throw new AppError("Yangilash uchun ma'lumot yuborilmadi", 400);

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
});

// POST /api/user/upload-avatar  (form-data: avatar=<file>)
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Rasm fayli yuborilmadi (maydon nomi: 'avatar')", 400);

  const result = await uploadBuffer(req.file.buffer, {
    folder: 'agroscan/avatars',
    public_id: `user_${req.user._id}`, // har doim bir xil nom -> eski rasm almashtiriladi
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }, { quality: 'auto', fetch_format: 'auto' }],
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatarURL: result.secure_url },
    { new: true }
  );

  res.json({ success: true, message: 'Profil rasmi yangilandi', avatarURL: user.avatarURL, user });
});
