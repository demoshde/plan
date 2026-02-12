import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  shiftType: {
    type: String,
    enum: ['day', 'night'],
    required: true
  },
  convoys: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('Shift', shiftSchema);
