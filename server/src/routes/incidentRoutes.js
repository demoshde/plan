import express from 'express';
import Incident from '../models/Incident.js';

const router = express.Router();

// Get incidents for a month
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const paddedMonth = month.padStart(2, '0');
    const startDate = `${year}-${paddedMonth}-01`;
    const endDate = `${year}-${paddedMonth}-31`;
    
    const incidents = await Incident.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
    
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all incidents
router.get('/', async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ date: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create incident
router.post('/', async (req, res) => {
  try {
    const incident = new Incident(req.body);
    const savedIncident = await incident.save();
    res.status(201).json(savedIncident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update incident
router.put('/:id', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete incident
router.delete('/:id', async (req, res) => {
  try {
    await Incident.findByIdAndDelete(req.params.id);
    res.json({ message: 'Incident deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
