import express from 'express';
import Plan from '../models/Plan.js';

const router = express.Router();

// Get plans by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const plans = await Plan.find({
      date: { $gte: startDate, $lte: endDate }
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get plans for a month
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const paddedMonth = month.padStart(2, '0');
    const startDate = `${year}-${paddedMonth}-01`;
    const endDate = `${year}-${paddedMonth}-31`;
    
    const plans = await Plan.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get or create plan for a date
router.get('/:date', async (req, res) => {
  try {
    const plan = await Plan.findOne({ date: req.params.date });
    res.json(plan || { date: req.params.date, targetCount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set daily plan
router.put('/:date', async (req, res) => {
  try {
    const { targetCount } = req.body;
    
    const plan = await Plan.findOneAndUpdate(
      { date: req.params.date },
      { date: req.params.date, targetCount },
      { new: true, upsert: true }
    );
    
    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Set monthly target
router.put('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const { monthlyTarget } = req.body;
    const paddedMonth = month.padStart(2, '0');
    const dateKey = `${year}-${paddedMonth}-target`;
    
    const plan = await Plan.findOneAndUpdate(
      { date: dateKey },
      { date: dateKey, monthlyTarget },
      { new: true, upsert: true }
    );
    
    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get monthly target
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const paddedMonth = month.padStart(2, '0');
    const dateKey = `${year}-${paddedMonth}-target`;
    
    const plan = await Plan.findOne({ date: dateKey });
    res.json(plan || { monthlyTarget: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
