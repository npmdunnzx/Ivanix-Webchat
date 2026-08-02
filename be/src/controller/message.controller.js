import messService from "../services/message.service.js";
import { raw } from "express";
import config from "../config/env.config.js";
import { io } from "../config/server.config.js";

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
    clientOffset,
  } = req.body;
  try {
    const message = await messService.newMessage(
      clientOffset,
      conversationId,
      senderId,
      content,
      messageType,
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

const uploadFilesMessage = async (req, res) => {
  const senderId = req.userId;
  const { conversationId, clientOffset } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files provided" });
  }

  try {
    const message = await messService.uploadFilesMessage(
      clientOffset ?? null,
      conversationId,
      senderId,
      files
    );
    console.log("message", message);
    io.to(`conversation:${conversationId}`).emit("message:new", message);

    res
      .status(201)
      .json({ message: "Files uploaded successfully", data: message });
  } catch (error) {
    console.error("Could not upload files" + error.message);
    res
      .status(500)
      .json({ message: "Could not upload files", error: error.message });
  }
};

export default {
  getMessages,
  newMessage,
  uploadFilesMessage,
};
