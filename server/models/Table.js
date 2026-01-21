import mongoose from "mongoose";

const TableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    capacity: { type: Number, default: 2 },
  },
  { timestamps: true }
);

export default mongoose.model("Table", TableSchema);
