import { Router } from "express";
import {
  listOrders,
  createOrder,
  updateOrderStatus,
  updateItemStatus,
} from "../controllers/ordersController.js";

const router = Router();
router.get("/", listOrders);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/items/:index/status", updateItemStatus);

export default router;
