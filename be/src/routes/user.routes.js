import userController from "../controller/user.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import express from "express";

const router = express.Router();

router.get("/me", protectRoute, userController.profile);
router.get("/search", protectRoute, userController.search);

export default router;