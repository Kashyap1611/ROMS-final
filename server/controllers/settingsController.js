import Setting from "../models/Setting.js";
import Order from "../models/Order.js";

const getGstRate = async () => {
  let s = await Setting.findOne();
  if (!s) s = await Setting.create({ gstRate: 0.05 });
  return s.gstRate;
};

export const getSettings = async (req, res) => {
  const gstRate = await getGstRate();
  const allOrders = await Order.find().lean();
  const allTimeSales = allOrders.reduce((sum, o) => sum + o.total, 0);
  const completedCount = allOrders.filter(
    (o) => o.status === "completed"
  ).length;
  res.json({
    gstRate,
    allTimeSales,
    completedCount,
    ordersCount: allOrders.length,
  });
};

export const updateGstRate = async (req, res) => {
  const { value } = req.body;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1)
    return res.status(400).json({ error: "Invalid GST rate" });
  let s = await Setting.findOne();
  if (!s) s = await Setting.create({ gstRate: num });
  else {
    s.gstRate = num;
    await s.save();
  }
  res.json({ gstRate: s.gstRate });
};

export const getDailyMetrics = async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dayOrders = await Order.find({
    timestamp: { $gte: startOfDay },
  }).lean();
  const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
  res.json({ orders: dayOrders.length, revenue });
};

export const getWeeklyMetrics = async (req, res) => {
  const startOfWeek = new Date();
  const dayIdx = startOfWeek.getDay();
  const diffToMonday = (dayIdx + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const weekOrders = await Order.find({
    timestamp: { $gte: startOfWeek },
  }).lean();
  const revenue = weekOrders.reduce((sum, o) => sum + o.total, 0);
  res.json({ orders: weekOrders.length, revenue });
};
