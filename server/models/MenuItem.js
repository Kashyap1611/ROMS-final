import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "" },
    available: { type: Boolean, default: true },
    vegetarian: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", MenuItemSchema);
