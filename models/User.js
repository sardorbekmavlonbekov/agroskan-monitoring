const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Ism majburiy'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email majburiy'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email noto'g'ri formatda"],
    },
    password: { type: String, required: [true, 'Parol majburiy'], minlength: 8, select: false },
    phone: { type: String, trim: true },
    farmName: { type: String, trim: true },
    location: { type: String, trim: true },
    area: { type: Number, min: 0 }, // gektar
    avatarURL: { type: String, default: 'https://via.placeholder.com/150' },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
