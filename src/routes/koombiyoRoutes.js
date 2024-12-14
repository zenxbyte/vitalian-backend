import express from "express";
import { getCitiesController } from "../controllers/koombiyoController.js";

const koombiyoRoutes = express.Router();

koombiyoRoutes.get("/noAuth/cities", getCitiesController);

export default koombiyoRoutes;
