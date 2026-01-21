import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "prepared", "completed"],
      default: "pending",
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "prepared", "completed"],
      default: "pending",
    },
    timestamp: { type: Date, default: Date.now },
    customerName: { type: String, default: "Guest" },
    customerPhone: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
