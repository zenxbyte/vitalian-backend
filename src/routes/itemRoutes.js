import express from "express";
import {
  createItemController,
  getItemController,
  getItemsByCategoryController,
  updateItemController,
} from "../controllers/itemController.js";
import { upload } from "../middlewares/upload.js";

const itemRoutes = express.Router();

itemRoutes.get("/noAuth/details/:id", getItemController);
itemRoutes.get("/noAuth/by-category/:id", getItemsByCategoryController);
itemRoutes.post("/auth/create/:id", upload.array("file"), createItemController);
itemRoutes.put("/auth/update/:id", upload.array("file"), updateItemController);

export default itemRoutes;
