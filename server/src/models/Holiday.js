import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  name: {
    type: String,
    required: true
  },
  country: {
    type: String,
    enum: ['🇲🇳', '🇨🇳'],
    default: '🇲🇳'
  },
  year: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Holiday', holidaySchema);
