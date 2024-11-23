import express from "express";
import authRoutes from "./authRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import itemRoutes from "./itemRoutes.js";
import orderRoutes from "./orderRoutes.js";

const router = express.Router();

router.use("/authentication", authRoutes);
router.use("/category", categoryRoutes);
router.use("/item", itemRoutes);
router.use("/order", orderRoutes);

export default router;
