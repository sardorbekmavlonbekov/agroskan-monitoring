// Birinchi ADMIN'ni yaratish: npm run seed:admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('MONGO_URI, ADMIN_EMAIL va ADMIN_PASSWORD .env faylida bo\'lishi kerak');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);

  let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (user) {
    user.role = 'ADMIN';
    user.status = 'ACTIVE';
    await user.save();
    console.log('Mavjud foydalanuvchi ADMIN qilindi:', user.email);
  } else {
    user = await User.create({
      name: ADMIN_NAME || 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'ADMIN',
    });
    console.log('ADMIN yaratildi:', user.email);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
