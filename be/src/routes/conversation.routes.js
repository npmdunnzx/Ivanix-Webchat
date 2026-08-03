import convController from '../controller/conversation.controller.js';
import express from 'express';
import {protectRoute} from "../middlewares/protectRoute.js";
import {checkGroupAdmin, checkConversationMember, checkGroupMemberLimit} from "../middlewares/checkGroupChat.js";
import {validate, newGroupChatRule, addMembersRule, startConversationRule} from "../middlewares/validate.js";

const router = express.Router();
router.use(protectRoute);

router.get("/", convController.getAllConversations);
router.post("/groups", [newGroupChatRule(), validate], convController.newGroupChat);
router.post("/groups/members", [checkGroupAdmin, checkGroupMemberLimit, addMembersRule(), validate], convController.addNewMembers);
router.post("/private", [startConversationRule(), validate], convController.checkExistChat);
router.get("/search", convController.searchConversation);
router.get("/groups/:conversation_id/members", [checkConversationMember], convController.getGroupMembers);
router.get("/:conversation_id/attachments", [checkConversationMember], convController.getConversationAttachments);
router.post("/leave", [checkConversationMember], convController.leaveConversation);
router.post("/:conversation_id/history", [checkConversationMember], convController.delConversationHistory);
router.post("/groups/members/remove", [checkGroupAdmin], convController.removeGroupMember);
router.put("/groups/name", [checkConversationMember], convController.renameGroup);
router.put("/groups/admin", [checkConversationMember], convController.transferAdmin);
router.delete("/groups/:conversation_id", [checkGroupAdmin], convController.deleteGroupConversation);

export default router;