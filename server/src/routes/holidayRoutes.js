import express from 'express';
import Holiday from '../models/Holiday.js';

const router = express.Router();

// Get holidays for a year
router.get('/year/:year', async (req, res) => {
  try {
    const holidays = await Holiday.find({ year: parseInt(req.params.year) }).sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all holidays
router.get('/', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create holiday (single or range)
router.post('/', async (req, res) => {
  try {
    const { startDate, endDate, name, country } = req.body;
    
    const holidays = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      holidays.push({
        date: dateStr,
        name,
        country: country || '🇲🇳',
        year: d.getFullYear()
      });
    }
    
    const savedHolidays = await Holiday.insertMany(holidays);
    res.status(201).json(savedHolidays);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete holiday
router.delete('/:id', async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete holidays by date range
router.delete('/range', async (req, res) => {
  try {
    const { startDate, endDate, name } = req.body;
    await Holiday.deleteMany({
      date: { $gte: startDate, $lte: endDate },
      name
    });
    res.json({ message: 'Holidays deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
