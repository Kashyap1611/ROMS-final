import { Router } from "express";
import {
  listMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from "../controllers/menuController.js";

const router = Router();

router.get("/", listMenu);
router.get("/:id", getMenuItem);
router.post("/", createMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

export default router;
