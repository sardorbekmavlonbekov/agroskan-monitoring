const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: [true, 'Sana majburiy'] },
    field: { type: String, required: [true, 'Dala nomi majburiy'], trim: true },
    action: {
      type: String,
      enum: ['Ekish', "Sug'orish", 'Dori sepish', "Hosil yig'ish"],
      required: [true, 'Amal turi majburiy'],
    },
    note: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

logSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.models.Log || mongoose.model('Log', logSchema);
