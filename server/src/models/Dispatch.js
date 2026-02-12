import mongoose from 'mongoose';

const dispatchRowSchema = new mongoose.Schema({
  convoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convoy',
    default: null
  },
  convoyName: {
    type: String,
    default: ''
  },
  startTime: {
    type: String,
    default: ''
  },
  endTime: {
    type: String,
    default: ''
  },
  totalHours: {
    type: String,
    default: ''
  },
  returned: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  }
});

const dispatchSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true
  },
  rows: [dispatchRowSchema]
}, {
  timestamps: true
});

export default mongoose.model('Dispatch', dispatchSchema);
