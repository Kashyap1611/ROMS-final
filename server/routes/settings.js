import { Router } from "express";
import {
  getSettings,
  updateGstRate,
  updateSettings,
} from "../controllers/settingsController.js";

const router = Router();
router.get("/", getSettings);
router.patch("/", updateSettings);
router.patch("/gst-rate", updateGstRate);

export default router;
