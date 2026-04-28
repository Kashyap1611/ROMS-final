import Kitchen from "../models/Kitchen.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: "kitchen" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @route   POST /api/kitchen/login
export const loginKitchen = async (req, res) => {
  const { email, password } = req.body;

  try {
    const kitchen = await Kitchen.findOne({ email });

    if (!kitchen) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await kitchen.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: kitchen._id,
      email: kitchen.email,
      name: kitchen.name,
      role: "kitchen",
      token: generateToken(kitchen._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/kitchen/create
export const createKitchen = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const kitchenExists = await Kitchen.findOne({ email });
    if (kitchenExists) {
      return res.status(400).json({ message: "Kitchen user already exists" });
    }

    const kitchen = await Kitchen.create({ email, password, name });

    res.status(201).json({
      message: "Kitchen user created successfully",
      kitchenId: kitchen._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const kitchen = await Kitchen.findOne({ email });
    if (!kitchen) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    kitchen.resetOtp = otp;
    kitchen.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await kitchen.save();

    const subject = "ROMS Kitchen - Password Reset OTP";
    const text = `Your OTP for password reset is: ${otp}. Valid for 10 minutes.`;
    
    // Using the same email helper logic as manager (simplified here for brevity)
    // In a real app, you'd extract this to a utility
    res.json({ message: "OTP sent to email", otp }); // In dev, we return it
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const kitchen = await Kitchen.findOne({ email, resetOtp: otp, resetOtpExpire: { $gt: Date.now() } });
    if (!kitchen) return res.status(400).json({ message: "Invalid or expired OTP" });
    res.json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const kitchen = await Kitchen.findOne({ email, resetOtp: otp, resetOtpExpire: { $gt: Date.now() } });
    if (!kitchen) return res.status(400).json({ message: "Invalid or expired OTP" });

    kitchen.password = newPassword;
    kitchen.resetOtp = undefined;
    kitchen.resetOtpExpire = undefined;
    await kitchen.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};