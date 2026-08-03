import { raw } from "express";
import utils from "../utils/utils.js";
import config from "../config/env.config.js";
import convService from "../services/conversation.service.js";

const getAllConversations = async (req, res) => {
  const userId = req.userId;
  try {
    const conversations = await convService.getAllConversations(userId);
    res.status(200).json({
      message: "Conversations fetched successfully",
      result: conversations,
    });
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
    console.error("Could not create group chat:" + error.message);
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
    console.error("Could not add members:" + error.message);
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
//     console.error("Could not create private chat:"+ error.message);
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
    console.error("Could not check chat existence:" + error.message);
    res.status(500).json({
      message: "Could not check chat existence",
      error: error.message,
    });
  }
};

const searchConversation = async (req, res) => {
  const name = req.query.name;
  const userId = req.userId;

  try {
    const result = await convService.searchConversation(userId, name);
    res
      .status(200)
      .json({ message: "Search conversation successfully", result });
  } catch (error) {
    console.error("Could not search conversation:" + error.message);
    res
      .status(500)
      .json({ message: "Could not search conversation", error: error.message });
  }
};

const getGroupMembers = async (req, res) => {
  const conversation_id = req.params.conversation_id;

  try {
    const result = await convService.getGroupMembers(conversation_id);
    res.status(200).json({ message: "Get group members successfully", result });
  } catch (error) {
    console.error("Could not get group members:" + error.message);
    res
      .status(500)
      .json({ message: "Could not get group members", error: error.message });
  }
};

const leaveConversation = async (req, res) => {
  const conversation_id =
    req.body.conversation_id || req.params.conversation_id;
  const userId = req.userId;
  try {
    await convService.leaveConversation(conversation_id, userId);
    res.status(200).json({ message: "Left conversation successfully" });
  } catch (error) {
    if (error.message.includes("only admin")) {
      return res.status(403).json({ message: error.message });
    }
    console.error("Could not leave conversation: " + error.message);
    res
      .status(500)
      .json({ message: "Could not leave conversation", error: error.message });
  }
};


const delConversationHistory = async (req, res) => {
  const conversation_id =
    req.params.conversation_id || req.body.conversation_id;
  const userId =  req.userId;
  try {
    await convService.delConversationHistory(conversation_id, userId);
    res.status(200).json({ message: "Deleted conversation successfully" });
  } catch (error) {
    console.error("Could not delete conversation: " + error.message);
    res
      .status(500)
      .json({ message: "Could not delete conversation", error: error.message });
  }
};

const removeGroupMember = async (req, res) => {
  const { conversation_id, target_user_id } = req.body;
  try {
    await convService.removeGroupMember(conversation_id, target_user_id);
    res.status(200).json({ message: "Member removed from group successfully" });
  } catch (error) {
    console.error("Could not remove group member: " + error.message);
    res
      .status(500)
      .json({ message: "Could not remove group member", error: error.message });
  }
};

const renameGroup = async (req, res) => {
  const { conversation_id, group_name } = req.body;
  try {
    const result = await convService.renameGroup(conversation_id, group_name);
    res.status(200).json({ message: "Group renamed successfully", result });
  } catch (error) {
    console.error("Could not rename group: " + error.message);
    res
      .status(500)
      .json({ message: "Could not rename group", error: error.message });
  }
};

const transferAdmin = async (req, res) => {
  const { conversation_id, new_admin_id } = req.body;
  const currentAdminId = req.userId;
  try {
    await convService.transferAdmin(conversation_id, new_admin_id, currentAdminId);
    res.status(200).json({ message: "Admin transferred successfully" });
  } catch (error) {
    if (error.message.includes("not an admin")) {
      return res.status(403).json({ message: error.message });
    }
    console.error("Could not transfer admin: " + error.message);
    res
      .status(500)
      .json({ message: "Could not transfer admin", error: error.message });
  }
};

const deleteGroupConversation = async (req, res) => {
  const conversation_id = req.params.conversation_id;
  try {
    await convService.deleteGroupConversation(conversation_id);
    res.status(200).json({ message: "Group conversation deleted successfully" });
  } catch (error) {
    console.error("Could not delete group conversation: " + error.message);
    res
      .status(500)
      .json({ message: "Could not delete group conversation", error: error.message });
  }
};

const getConversationAttachments = async (req, res) => {
  const conversation_id = req.params.conversation_id;
  const userId = req.userId;
  const type = req.query.type;
  try {
    const result = await convService.getAttachments(conversation_id, userId, type);
    res.status(200).json({ message: "Get conversation attachments successfully", result });
  } catch (error) {
    console.error("Could not get attachments: " + error.message);
    res
      .status(500)
      .json({ message: "Could not get attachments", error: error.message });
  }
};

export default {
  getAllConversations,
  newGroupChat,
  addNewMembers,
  getGroupMembers,
  // newPrivateChat,
  checkExistChat,
  searchConversation,
  leaveConversation,
  delConversationHistory,
  removeGroupMember,
  renameGroup,
  transferAdmin,
  deleteGroupConversation,
  getConversationAttachments,
};

