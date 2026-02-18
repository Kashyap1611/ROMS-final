import Manager from "../models/Manager.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @route   POST /api/manager/login
export const loginManager = async (req, res) => {
  const { email, password } = req.body;

  try {
    const manager = await Manager.findOne({ email });

    if (!manager) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await manager.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: manager._id,
      email: manager.email,
      token: generateToken(manager._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/manager/create (optional – admin only)
export const createManager = async (req, res) => {
  const { email, password } = req.body;

  const managerExists = await Manager.findOne({ email });
  if (managerExists) {
    return res.status(400).json({ message: "Manager already exists" });
  }

  const manager = await Manager.create({ email, password });

  res.status(201).json({
    message: "Manager created successfully",
    managerId: manager._id,
  });
};

const sendEmail = async (email, subject, text) => {
  try {
    if (process.env.SMTP_HOST) {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: '"ROMS Manager" <no-reply@roms.com>',
        to: email,
        subject,
        text,
      });
      return { success: true };
    }
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    const info = await transporter.sendMail({
      from: '"ROMS Manager (Dev)" <no-reply@roms.dev>',
      to: email,
      subject,
      text,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Dev Email Preview] ${previewUrl}`);
    }
    return { success: true, previewUrl };
  } catch (error) {
    console.error('[Email Error]', error.message);
    console.log(`[Mock Email Fallback] To: ${email}, Subject: ${subject}, Body: ${text}`);
    return { success: false };
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const manager = await Manager.findOne({ email });
    if (!manager) {
      return res.status(404).json({ message: "Email not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    manager.resetOtp = otp;
    manager.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await manager.save();

    const result = await sendEmail(email, 'Password Reset OTP', `Your OTP is: ${otp}`);
    if (!result.success && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: "Email service not configured" });
    }
    res.json({ message: "OTP sent to email", previewUrl: result.previewUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const manager = await Manager.findOne({
      email,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() }
    });
    if (!manager) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const manager = await Manager.findOne({
      email,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() }
    });
    if (!manager) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    manager.password = newPassword;
    manager.resetOtp = undefined;
    manager.resetOtpExpire = undefined;
    await manager.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
