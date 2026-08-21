import messController from "../controller/message.controller.js";
import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { checkConversationMember } from "../middlewares/checkGroupChat.js";
import upload from "../config/multer.config.js";

const router = express.Router();
router.use(protectRoute);

router.get("/", checkConversationMember, messController.getMessages);
router.post("/", checkConversationMember, messController.newMessage);
router.post(
  "/files",
  upload.array("files", 5),
  [checkConversationMember],
  messController.uploadFilesMessage
);

export default router;
