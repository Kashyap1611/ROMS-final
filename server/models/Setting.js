import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema(
  {
    gstRate: { type: Number, default: 0.05 },
    maxCapacity: { type: Number, default: 50 },
  },
  { timestamps: true }
);

export default mongoose.model("Setting", SettingSchema);
