import express from "express";
import {
  loginKitchen,
  createKitchen,
  forgotPassword,
  verifyOtp,
  resetPassword
} from "../controllers/kitchenController.js";

const router = express.Router();

router.post("/login", loginKitchen);
router.post("/create", createKitchen);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;