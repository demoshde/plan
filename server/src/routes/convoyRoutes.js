import express from 'express';
import Convoy from '../models/Convoy.js';

const router = express.Router();

// Get all convoys
router.get('/', async (req, res) => {
  try {
    const convoys = await Convoy.find({ isActive: true }).sort({ order: 1 });
    res.json(convoys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update convoy order (for drag & drop) - must be before /:id
router.put('/reorder', async (req, res) => {
  try {
    const { convoyOrders } = req.body; // [{ id, order }, ...]
    const bulkOps = convoyOrders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { order }
      }
    }));
    await Convoy.bulkWrite(bulkOps);
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get convoy by ID
router.get('/:id', async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) {
      return res.status(404).json({ message: 'Convoy not found' });
    }
    res.json(convoy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create convoy
router.post('/', async (req, res) => {
  try {
    const convoy = new Convoy(req.body);
    const savedConvoy = await convoy.save();
    res.status(201).json(savedConvoy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update convoy
router.put('/:id', async (req, res) => {
  try {
    const convoy = await Convoy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!convoy) {
      return res.status(404).json({ message: 'Convoy not found' });
    }
    res.json(convoy);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete convoy (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const convoy = await Convoy.findByIdAndDelete(req.params.id);
    if (!convoy) {
      return res.status(404).json({ message: 'Convoy not found' });
    }
    res.json({ message: 'Convoy deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cleanup inactive convoys (remove soft-deleted)
router.delete('/cleanup/inactive', async (req, res) => {
  try {
    const result = await Convoy.deleteMany({ isActive: false });
    res.json({ message: `Removed ${result.deletedCount} inactive convoys` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed initial convoy data
router.post('/seed', async (req, res) => {
  try {
    // Clear existing and reseed
    await Convoy.deleteMany({});

    const convoys = [
      // SGC Fleet (7 total)
      { name: 'SGC-1', fleet: 'SGC', order: 1 },
      { name: 'SGC-2', fleet: 'SGC', order: 2 },
      { name: 'SGC-3', fleet: 'SGC', order: 3 },
      { name: 'SGC-4', fleet: 'SGC', order: 4 },
      { name: 'SGC-5', fleet: 'SGC', order: 5 },
      { name: 'SGC-6', fleet: 'SGC', order: 6 },
      { name: 'SGC-7', fleet: 'SGC', order: 7 },
      // KBTL Fleet (4 total)
      { name: 'KBTL-1', fleet: 'KBTL', order: 8 },
      { name: 'KBTL-2', fleet: 'KBTL', order: 9 },
      { name: 'KBTL-3', fleet: 'KBTL', order: 10 },
      { name: 'KBTL-4', fleet: 'KBTL', order: 11 },
      // TE Fleet (5 total)
      { name: 'TE-1', fleet: 'TE', order: 12 },
      { name: 'TE-2', fleet: 'TE', order: 13 },
      { name: 'TE-3', fleet: 'TE', order: 14 },
      { name: 'TE-4', fleet: 'TE', order: 15 },
      { name: 'TE-5', fleet: 'TE', order: 16 },
    ];

    await Convoy.insertMany(convoys);
    res.status(201).json({ message: 'Convoys seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
