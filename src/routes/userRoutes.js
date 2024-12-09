import express from "express";
import {
  createUserController,
  deleteUserController,
  getAllAdminController,
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.post("/auth/create", createUserController);
userRoutes.delete("/auth/delete/:id", deleteUserController);
userRoutes.get("/auth/all", getAllAdminController);

export default userRoutes;
