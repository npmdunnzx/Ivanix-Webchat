import friendController from "../controller/friend.controller.js";
import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { validate } from "../middlewares/validate.js";

const router = express.Router();
router.use(protectRoute);

router.post("/send-request", friendController.sendRequest);
router.post("/response-request", friendController.responseRequest);
router.get("/pending-requests", friendController.getPendingRequest);
router.get("/", friendController.getFriends);

export default router;