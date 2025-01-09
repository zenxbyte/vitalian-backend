import express from "express";
import {
  cancelOrderController,
  createDeliveryOrdersController,
  createOrderController,
  createPickUpOrdersController,
  getOrderController,
  getOrderCountController,
  getOrdersController,
  onPaymentErrorController,
  onPaymentSuccessController,
  PendingOrdersController,
  recentPickupOrdersController,
  recentTransactionsController,
  updateOrderStatusController,
  updatePaymentStatus,
} from "../controllers/orderController.js";

const orderRoutes = express.Router();

orderRoutes.get("/auth/details/:id", getOrderController);
orderRoutes.post("/noAuth/create", createOrderController);
orderRoutes.get("/auth/filter", getOrdersController);
orderRoutes.get("/auth/stat-count", getOrderCountController);
orderRoutes.put("/noAuth/onSuccess/:id", onPaymentSuccessController);
orderRoutes.put("/noAuth/onError/:id", onPaymentErrorController);
orderRoutes.get("/auth/transactions", recentTransactionsController);
orderRoutes.get("/auth/recent-orders", PendingOrdersController);
orderRoutes.put("/auth/update-status", updateOrderStatusController);
orderRoutes.get("/auth/create-delivery-orders", createDeliveryOrdersController);
orderRoutes.post("/auth/request-pickup", createPickUpOrdersController);
orderRoutes.get("/auth/recent-pickup-rqsts", recentPickupOrdersController);
orderRoutes.post("/auth/cancel-order/:id", cancelOrderController);
orderRoutes.post("/auth/update-payment-status", updatePaymentStatus);

export default orderRoutes;
