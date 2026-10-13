const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: [true, 'Sana majburiy'] },
    title: { type: String, required: [true, 'Sarlavha majburiy'], trim: true, maxlength: 200 },
    status: { type: String, enum: ['Bajarildi', 'Kutilmoqda'], default: 'Kutilmoqda' },
  },
  { timestamps: true }
);

calendarSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.models.Calendar || mongoose.model('Calendar', calendarSchema);
