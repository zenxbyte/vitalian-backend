import express from "express";
import { createMessageController } from "../controllers/messageController.js";

const messageRoutes = express.Router();

messageRoutes.post("/noAuth/create", createMessageController);

export default messageRoutes;
