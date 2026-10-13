const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ["Urug'", "O'g'it", "Yoqilg'i", 'Ish haqi', 'Texnika'],
      required: [true, 'Turkum majburiy'],
    },
    amount: { type: Number, required: [true, 'Summa majburiy'], min: [0, "Summa manfiy bo'lmasligi kerak"] },
    date: { type: Date, required: [true, 'Sana majburiy'] },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
