import express from "express";
import {
  createOrderController,
  getOrderCountController,
  getOrdersController,
} from "../controllers/orderController.js";

const orderRoutes = express.Router();

orderRoutes.post("/noAuth/create", createOrderController);
orderRoutes.get("/auth/filter", getOrdersController);
orderRoutes.get("/auth/stat-count", getOrderCountController);

export default orderRoutes;
