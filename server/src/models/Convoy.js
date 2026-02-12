import mongoose from 'mongoose';

const convoySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  fleet: {
    type: String,
    enum: ['SGC', 'KBTL', 'TE'],
    required: true
  },
  status: {
    type: String,
    enum: ['', 'down', 'loaded', 'empty', 'hf', 'gsk', 'inspection'],
    default: ''
  },
  inspectionDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Convoy', convoySchema);
