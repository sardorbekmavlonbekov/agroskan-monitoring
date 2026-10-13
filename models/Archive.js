const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    year: { type: Number, required: [true, 'Yil majburiy'], min: 1900, max: 2200 },
    crop: { type: String, required: [true, 'Ekin nomi majburiy'], trim: true },
    yield: { type: Number, min: 0 }, // tsentner/tonna
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

archiveSchema.index({ userId: 1, year: -1 });

module.exports = mongoose.models.Archive || mongoose.model('Archive', archiveSchema);
