import Table from '../models/Table.js';
import Setting from '../models/Setting.js';

export const listTables = async (req, res) => {
  const tables = await Table.find().sort({ number: 1 }).lean();
  res.json(tables);
};

export const createTable = async (req, res) => {
  const { capacity } = req.body;
  const cap = Number(capacity);
  
  if (isNaN(cap) || cap <= 0) {
    return res.status(400).json({ error: 'Please provide a valid seating capacity' });
  }

  // Check total capacity
  const s = await Setting.findOne() || { maxCapacity: 50 };
  const limit = Number(s.maxCapacity) || 50;
  const currentTables = await Table.find().lean();
  const currentTotalCapacity = currentTables.reduce((sum, t) => sum + (Number(t.capacity) || 0), 0);
  
  if (currentTotalCapacity + cap > limit) {
    return res.status(400).json({ 
      error: `Cannot add table. Restaurant capacity limit reached (${currentTotalCapacity}/${limit})` 
    });
  }

  // Auto-generate sequential table number
  const existingNumbers = currentTables
    .map(t => Number(t.number))
    .filter(n => !isNaN(n) && n > 0)
    .sort((a, b) => a - b);
    
  let nextNumber = 1;
  for (const num of existingNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else if (num > nextNumber) {
      break;
    }
  }

  try {
    const table = await Table.create({ number: nextNumber, capacity: cap, status: 'available' });
    res.status(201).json(table);
    const io = req.app.get('io');
    if (io) io.emit('tables:updated');
  } catch (error) {
    console.error("Error creating table:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Table number conflict. Please try again.' });
    }
    res.status(500).json({ error: 'Database error while creating table' });
  }
};

export const deleteTable = async (req, res) => {
  const { id } = req.params;
  const table = await Table.findByIdAndDelete(id);
  if (!table) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
  const io = req.app.get('io');
  if (io) io.emit('tables:updated');
};

export const updateTableStatusById = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['available', 'occupied', 'reserved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const table = await Table.findByIdAndUpdate(id, { status }, { new: true });
  if (!table) return res.status(404).json({ error: 'Not found' });
  res.json(table);
  const io = req.app.get('io');
  if (io) io.emit('tables:updated');
};

export const updateTableStatusByNumber = async (req, res) => {
  const { number } = req.params;
  const { status } = req.body;
  const num = Number(number);
  if (!Number.isInteger(num) || num <= 0) {
    return res.status(400).json({ error: 'Invalid table number format for update' });
  }
  if (!['available', 'occupied', 'reserved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const table = await Table.findOneAndUpdate({ number: num }, { status }, { new: true });
  if (!table) return res.status(404).json({ error: 'Not found' });
  res.json(table);
  const io = req.app.get('io');
  if (io) io.emit('tables:updated');
};
