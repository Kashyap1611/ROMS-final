import Order from "../models/Order.js";

export const listOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const orders = await Order.find(q).sort({ timestamp: -1 }).lean();
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: "Failed to list orders" });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { tableNumber, items, customerName, customerPhone } = req.body;
    if (!tableNumber || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order" });
    }

    const itemsWithStatus = items.map((it) => ({ ...it, status: "pending" }));
    const newItemsTotal = itemsWithStatus.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    // Check for existing active order for this table
    let order = await Order.findOne({
      tableNumber,
      status: { $ne: 'completed' }
    });

    if (order) {
      // Append new items to existing order
      order.items.push(...itemsWithStatus);
      order.total += newItemsTotal;
      // If order was ready or prepared, move back to preparing since new items are pending
      if (['ready', 'prepared'].includes(order.status)) {
        order.status = 'preparing';
      }
      // If it was pending, it stays pending. If preparing, stays preparing.
      // Ensure we update timestamp to reflect latest activity
      order.timestamp = new Date();
      await order.save();
    } else {
      // Create new order
      order = await Order.create({
        tableNumber,
        items: itemsWithStatus,
        total: newItemsTotal,
        status: "pending",
        timestamp: new Date(),
        customerName: customerName || "Guest",
        customerPhone: customerPhone || "",
      });
    }

    res.status(201).json(order);
    const io = req.app.get('io');
    if (io) {
      io.emit('orders:updated');
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
  const io = req.app.get('io');
  if (io) {
    io.emit('orders:updated');
  }
};

export const updateItemStatus = async (req, res) => {
  const { id, index } = req.params;
  const { status } = req.body;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ error: "Not found" });
  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= order.items.length)
    return res.status(400).json({ error: "Invalid item index" });
  order.items[idx].status = status;
  const allCompleted = order.items.every((it) => it.status === "completed");
  if (allCompleted) order.status = "completed";
  await order.save();
  res.json(order);
  const io = req.app.get('io');
  if (io) {
    io.emit('orders:updated');
    io.emit('order:itemUpdated', { orderId: String(order._id) });
  }
};
