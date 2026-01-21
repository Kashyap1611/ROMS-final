import Table from '../models/Table.js';

export const listTables = async (req, res) => {
  const tables = await Table.find().lean();
  res.json(tables);
};

export const createTable = async (req, res) => {
  const { number, capacity } = req.body;
  const num = Number(number);
  const cap = Number(capacity);
  if (!Number.isInteger(num) || num <= 0) {
    return res.status(400).json({ error: 'Invalid table number' });
  }
  if (!Number.isInteger(cap) || cap <= 0) {
    return res.status(400).json({ error: 'Invalid capacity' });
  }
  const exists = await Table.findOne({ number: num });
  if (exists) {
    return res.status(400).json({ error: 'Table number already exists' });
  }
  const table = await Table.create({ number: num, capacity: cap, status: 'available' });
  res.status(201).json(table);
  const io = req.app.get('io');
  if (io) io.emit('tables:updated');
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
    return res.status(400).json({ error: 'Invalid table number' });
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
