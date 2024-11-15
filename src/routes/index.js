import express from "express";
import authRoutes from "./authRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import itemRoutes from "./itemRoutes.js";

const router = express.Router();

router.use("/authentication", authRoutes);
router.use("/category", categoryRoutes);
router.use("/item", itemRoutes);

export default router;
