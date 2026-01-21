import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const managerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "manager",
    },
    name: {
        type: String,
        default: "Manager",
    },
    resetOtp: {
      type: String,
    },
    resetOtpExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before save
managerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
managerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Manager", managerSchema);
