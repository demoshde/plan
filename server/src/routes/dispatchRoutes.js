import express from 'express';
import Dispatch from '../models/Dispatch.js';

const router = express.Router();

// Get dispatches for a date range (week view)
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dispatches = await Dispatch.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dispatch by date
router.get('/:date', async (req, res) => {
  try {
    let dispatch = await Dispatch.findOne({ date: req.params.date });
    
    // If no dispatch exists for this date, create empty rows
    if (!dispatch) {
      const emptyRows = Array.from({ length: 20 }, (_, i) => ({
        convoyId: null,
        convoyName: '',
        startTime: '',
        endTime: '',
        totalHours: '',
        returned: false,
        order: i
      }));
      dispatch = { date: req.params.date, rows: emptyRows };
    }
    
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update dispatch for a date
router.put('/:date', async (req, res) => {
  try {
    const { rows } = req.body;
    
    const dispatch = await Dispatch.findOneAndUpdate(
      { date: req.params.date },
      { date: req.params.date, rows },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json(dispatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update single row in a dispatch
router.patch('/:date/row/:rowIndex', async (req, res) => {
  try {
    const { date, rowIndex } = req.params;
    const updateData = req.body;
    
    const dispatch = await Dispatch.findOne({ date });
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found' });
    }
    
    const idx = parseInt(rowIndex);
    if (idx >= 0 && idx < dispatch.rows.length) {
      Object.assign(dispatch.rows[idx], updateData);
      await dispatch.save();
    }
    
    res.json(dispatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get KPIs for a date range
router.get('/kpi/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dispatches = await Dispatch.find({
      date: { $gte: startDate, $lte: endDate }
    });
    
    let total = 0;
    let returned = 0;
    let totalMinutes = 0;
    let tripsWithTime = 0;
    let overtime = 0;
    let sgc = 0;
    let kbtl = 0;
    let te = 0;
    
    dispatches.forEach(dispatch => {
      dispatch.rows.forEach(row => {
        if (row.convoyName) {
          total++;
          if (row.returned) returned++;
          
          // Fleet breakdown
          if (row.convoyName.includes('SGC')) sgc++;
          else if (row.convoyName.includes('KBTL')) kbtl++;
          else if (row.convoyName.includes('TE')) te++;
          
          // Calculate hours
          if (row.startTime && row.endTime) {
            const [h1, m1] = row.startTime.split(':').map(Number);
            const [h2, m2] = row.endTime.split(':').map(Number);
            let startMin = h1 * 60 + m1;
            let endMin = h2 * 60 + m2;
            if (endMin < startMin) endMin += 24 * 60;
            const diff = endMin - startMin;
            totalMinutes += diff;
            tripsWithTime++;
            
            if (diff > 12 * 60) overtime++;
          }
        }
      });
    });
    
    const avgMinutes = tripsWithTime > 0 ? Math.round(totalMinutes / tripsWithTime) : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;
    
    res.json({
      total,
      returned,
      pending: total - returned,
      avgHours: `${avgHours}:${avgMins.toString().padStart(2, '0')}`,
      overtime,
      sgc,
      kbtl,
      te
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
