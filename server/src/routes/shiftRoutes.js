import express from 'express';
import Shift from '../models/Shift.js';

const router = express.Router();

// Get all shifts
router.get('/', async (req, res) => {
  try {
    const shifts = await Shift.find();
    const result = {
      day: [],
      night: []
    };
    
    shifts.forEach(shift => {
      result[shift.shiftType] = shift.convoys;
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update all shifts at once
router.put('/', async (req, res) => {
  try {
    const { day, night } = req.body;
    
    await Shift.findOneAndUpdate(
      { shiftType: 'day' },
      { shiftType: 'day', convoys: day || [] },
      { upsert: true }
    );
    
    await Shift.findOneAndUpdate(
      { shiftType: 'night' },
      { shiftType: 'night', convoys: night || [] },
      { upsert: true }
    );
    
    res.json({ day, night });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update shift convoys
router.put('/:shiftType', async (req, res) => {
  try {
    const { shiftType } = req.params;
    const { convoys } = req.body;
    
    const shift = await Shift.findOneAndUpdate(
      { shiftType },
      { shiftType, convoys },
      { new: true, upsert: true }
    );
    
    res.json(shift);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add convoy to shift
router.post('/:shiftType/convoy', async (req, res) => {
  try {
    const { shiftType } = req.params;
    const { convoyName } = req.body;
    
    let shift = await Shift.findOne({ shiftType });
    if (!shift) {
      shift = new Shift({ shiftType, convoys: [] });
    }
    
    if (!shift.convoys.includes(convoyName)) {
      shift.convoys.push(convoyName);
      await shift.save();
    }
    
    res.json(shift);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove convoy from shift
router.delete('/:shiftType/convoy/:convoyName', async (req, res) => {
  try {
    const { shiftType, convoyName } = req.params;
    
    const shift = await Shift.findOne({ shiftType });
    if (shift) {
      shift.convoys = shift.convoys.filter(c => c !== convoyName);
      await shift.save();
    }
    
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
