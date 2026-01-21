import express from "express";
import {
  loginManager,
  createManager,
  forgotPassword,
  verifyOtp,
  resetPassword
} from "../controllers/managerController.js";

const router = express.Router();

router.post("/login", loginManager);
router.post("/create", createManager); // optional
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
