import { Router } from "express";
import {
  getSettings,
  updateGstRate,
} from "../controllers/settingsController.js";

const router = Router();
router.get("/", getSettings);
router.patch("/gst-rate", updateGstRate);

export default router;
