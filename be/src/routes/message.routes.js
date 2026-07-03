import messController from '../controller/message.controller.js';
import express from 'express';
import {protectRoute} from "../middlewares/protectRoute.js";
const router = express.Router();
router.use(protectRoute);

router.get("/", messController.getMessages);
router.post("/", messController.newMessage);

export default router;