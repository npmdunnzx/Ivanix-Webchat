import messController from '../controller/message.controller.js';
import express from 'express';
import {protectRoute} from "../middlewares/protectRoute.js";
import { checkConversationMember } from "../middlewares/checkGroupChat.js";

const router = express.Router();
router.use(protectRoute);

router.get("/", checkConversationMember, messController.getMessages);
router.post("/", checkConversationMember, messController.newMessage);

export default router;