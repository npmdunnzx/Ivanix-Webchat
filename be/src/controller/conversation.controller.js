import { raw } from "express";
import utils from "../utils/utils.js";
import config from "../config/env.config.js";
import convService from "../services/conversation.service.js";

const getAllConversations = async (req, res) => {
  const userId = req.userId;
  try {
    const conversations = await convService.getAllConversations(userId);
    res.status(200).json(conversations);
  } catch (err) {
    console.error("Could not get conversations:", err.message);
    res
      .status(500)
      .json({ message: "Could not get conversations", error: err.message });
  }
};

const newGroupChat = async (req, res) => {
  const { groupName, membersId } = req.body;
  const adminId = req.userId;
  try {
    const result = await convService.newGroupChat(
      groupName,
      adminId,
      membersId,
    );
    res
      .status(201)
      .json({ message: "Group chat created successfully", result });
  } catch (error) {
    console.error("Could not create group chat:", error.message);
    res
      .status(500)
      .json({ message: "Could not create group chat:", error: error.message });
  }
};

const addNewMembers = async (req, res) => {
  const { membersId, conversation_id } = req.body;
  try {
    const result = await convService.addNewMembers(conversation_id, membersId);
    res.status(200).json({ message: "Members added successfully", result });
  } catch (error) {
    console.error("Could not add members:", error.message);
    res
      .status(500)
      .json({ message: "Could not add members", error: error.message });
  }
};

// const newPrivateChat = async (req, res) => {
//   const userId = req.userId;
//   const { partnerId } = req.body;
//   const participant_key = convService.generateParticipantKey(userId, partnerId);
//   try {
//     const result = await convService.newPrivateChat(
//       participant_key,
//       userId,
//       partnerId,
//     );
//     res
//       .status(201)
//       .json({ message: "Private chat created successfully", result });
//   } catch (error) {
//     console.error("Could not create private chat:", error.message);
//     res
//       .status(500)
//       .json({ message: "Could not create private chat", error: error.message });
//   }
// };

const checkExistChat = async (req, res) => {
  const userId = req.userId;
  const { partnerId } = req.body;  
  try {
    const result = await convService.checkExistChat(userId, partnerId);
    if (result.created === false) {
      res.status(200).json({ message: "Chat already exists", result });
    } else {
      res
        .status(201)
        .json({ message: "Private chat created successfully", result });
    }
  } catch (error) {
    console.error("Could not check chat existence:", error.message);
    res
      .status(500)
      .json({
        message: "Could not check chat existence",
        error: error.message,
      });
  }
};

const searchGroupByName = async (req, res) => {
  const name = req.query.q || req.query.name;
  const userId = req.userId;

  try {
    const result = await convService.searchGroupByName(userId, name);
    res.status(200).json({ message: "Search group successfully", result });
  } catch (error) {
    console.error("Could not search group:", error.message);
    res
      .status(500)
      .json({ message: "Could not search group", error: error.message });
  }
};

export default {
  getAllConversations,
  newGroupChat,
  addNewMembers,
  // newPrivateChat,
  checkExistChat,
  searchGroupByName,
};
