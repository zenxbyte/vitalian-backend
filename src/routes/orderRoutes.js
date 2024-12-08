import express from "express";
import {
  createOrderController,
  getOrderController,
  getOrderCountController,
  getOrdersController,
  onPaymentErrorController,
  onPaymentSuccessController,
} from "../controllers/orderController.js";

const orderRoutes = express.Router();

orderRoutes.get("/auth/details/:id", getOrderController);
orderRoutes.post("/noAuth/create", createOrderController);
orderRoutes.get("/auth/filter", getOrdersController);
orderRoutes.get("/auth/stat-count", getOrderCountController);
orderRoutes.put("/noAuth/onSuccess/:id", onPaymentSuccessController);
orderRoutes.put("/noAuth/onError/:id", onPaymentErrorController);

export default orderRoutes;
