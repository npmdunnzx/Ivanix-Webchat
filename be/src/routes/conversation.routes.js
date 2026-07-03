import convController from '../controller/conversation.controller.js';
import express from 'express';
import {protectRoute} from "../middlewares/protectRoute.js";
import {checkGroupAdmin} from "../middlewares/checkGroupChat.js";
import {validate, newGroupChatRule, addMembersRule, startConversationRule} from "../middlewares/validate.js";

const router = express.Router();
router.use(protectRoute);

router.get("/", convController.getAllConversations);
router.post("/groups", [newGroupChatRule(), validate], convController.newGroupChat);
router.post("/groups/members", [checkGroupAdmin, addMembersRule(), validate], convController.addNewMembers);
router.post("/private", [startConversationRule(), validate], convController.checkExistChat);
router.get("/groups/search", convController.searchGroupByName);

export default router;