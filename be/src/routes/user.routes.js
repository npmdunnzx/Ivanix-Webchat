import userController from "../controller/user.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";
import express from "express";

import upload from "../config/multer.config.js";

const router = express.Router();

router.get("/me", protectRoute, userController.profile);
router.get("/search", protectRoute, userController.search);
router.put("/profile", protectRoute, upload.single("avatar"), userController.updateProfile);

export default router;