import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true
  },
  targetCount: {
    type: Number,
    default: 0
  },
  monthlyTarget: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Plan', planSchema);
