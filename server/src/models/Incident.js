import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('Incident', incidentSchema);
