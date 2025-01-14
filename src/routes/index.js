import express from "express";
import authRoutes from "./authRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import itemRoutes from "./itemRoutes.js";
import orderRoutes from "./orderRoutes.js";
import userRoutes from "./userRoutes.js";
import messageRoutes from "./messageRoutes.js";
import koombiyoRoutes from "./koombiyoRoutes.js";

const router = express.Router();

router.use("/authentication", authRoutes);
router.use("/user", userRoutes);
router.use("/category", categoryRoutes);
router.use("/item", itemRoutes);
router.use("/order", orderRoutes);
router.use("/contact", messageRoutes);
router.use("/koombiyo", koombiyoRoutes);

export default router;
