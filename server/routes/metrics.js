import { Router } from "express";
import {
  getDailyMetrics,
  getWeeklyMetrics,
} from "../controllers/settingsController.js";

const router = Router();
router.get("/daily", getDailyMetrics);
router.get("/weekly", getWeeklyMetrics);

export default router;
