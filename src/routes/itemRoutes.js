import express from "express";
import {
  createItemController,
  getItemController,
  getItemsByCategoryController,
  getItemsController,
  getLowStockItemsController,
  updateItemController,
} from "../controllers/itemController.js";
import { upload } from "../middlewares/upload.js";

const itemRoutes = express.Router();

itemRoutes.get("/noAuth/items", getItemsController);
itemRoutes.get("/noAuth/details/:id", getItemController);
itemRoutes.get("/noAuth/by-category", getItemsByCategoryController);
itemRoutes.post(
  "/auth/create/:id",
  upload.fields([
    { name: "file", maxCount: 10 },
    { name: "chart", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  createItemController
);
itemRoutes.put(
  "/auth/update/:id",
  upload.fields([
    { name: "file", maxCount: 10 },
    { name: "chart", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateItemController
);
itemRoutes.get("/auth/low-stock", getLowStockItemsController);

export default itemRoutes;
