import express from "express";

import {
  createCategoryController,
  getCategoriesController,
  updateCategoryController,
} from "../controllers/categoryController.js";

const categoryRoutes = express.Router();

categoryRoutes.get("/noAuth/categories", getCategoriesController);
categoryRoutes.post("/auth/", createCategoryController);
categoryRoutes.put("/auth/:id", updateCategoryController);

export default categoryRoutes;
