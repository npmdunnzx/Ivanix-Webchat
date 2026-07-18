import messService from "../services/message.service.js";
import { raw } from "express";
import config from "../config/env.config.js";

const getMessages = async (req, res) => {
  const { conversationId } = req.query;
  const userId = req.userId;
  try {
    const messages = await messService.getMessages(conversationId, userId);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Could not get messages" + error.message);
    res
      .status(500)
      .json({ message: "Could not get messages", error: error.message });
  }
};

const newMessage = async (req, res) => {
  const senderId = req.userId;
  const {
    conversationId,
    content,
    messageType,
    fileUrl,
    fileName,
    clientOffset,
  } = req.body;
  try {
    const message = await messService.newMessage(
      clientOffset,
      conversationId,
      senderId,
      content,
      messageType,
      fileUrl,
      fileName,
    );
    res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (error) {
    console.error("Could not send message" + error.message);
    res
      .status(500)
      .json({ message: "Could not send message", error: error.message });
  }
};

export default {
  getMessages,
  newMessage,
};
