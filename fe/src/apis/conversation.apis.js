import { axiosClient } from "./axiosClient.js";

const getAllConversations = async () => {
  const response = await axiosClient.get("/conversations");
  return response.data;
};

const newGroupChat = async (groupName, membersId) => {
  const response = await axiosClient.post("/conversations/groups", {
    groupName,
    membersId,
  });
  return response.data;
};

const addNewMembers = async (conversationId, membersId) => {
  const response = await axiosClient.post("/conversations/groups/members", {
    conversationId,
    membersId,
  });
  return response.data;
};

const checkExistChat = async (partnerId) => {
  const response = await axiosClient.post("/conversations/private", {
    partnerId,
  });
  return response.data;
};

const searchConversation = async (name) => {
  const response = await axiosClient.get(`/conversations/search?name=${name}`);
  return response.data;
};

const getGroupMembers = async (conversationId) => {
  const response = await axiosClient.get(
    `/conversations/groups/${conversationId}/members`,
  );
  return response.data;
};

const leaveConversation = async (conversationId) => {
  const response = await axiosClient.post("/conversations/leave", {
    conversationId,
  });
  return response.data;
};

const delConversationHistory = async (conversationId, userId) => {
  const response = await axiosClient.post(
    `/conversations/${conversationId}/history`,
    {
      data: { userId },
    }
  );
  return response.data;
};

const removeGroupMember = async (conversationId, targetUserId) => {
  const response = await axiosClient.post(
    "/conversations/groups/members/remove",
    {
      conversationId,
      targetUserId,
    },
  );
  return response.data;
};

const renameGroup = async (conversationId, groupName) => {
  const response = await axiosClient.put("/conversations/groups/name", {
    conversationId,
    groupName,
  });
  return response.data;
};

const transferAdmin = async (conversationId, newAdminId) => {
  const response = await axiosClient.put("/conversations/groups/admin", {
    conversationId,
    newAdminId,
  });
  return response.data;
};

const deleteGroupConversation = async (conversationId) => {
  const response = await axiosClient.delete(`/conversations/groups/${conversationId}`);
  return response.data;
};

const getConversationAttachments = async (conversationId, type) => {
  const response = await axiosClient.get(
    `/conversations/${conversationId}/attachments${type ? `?type=${type}` : ""}`
  );
  return response.data;
};

export default {
  getAllConversations,
  newGroupChat,
  addNewMembers,
  checkExistChat,
  searchConversation,
  getGroupMembers,
  leaveConversation,
  delConversationHistory,
  removeGroupMember,
  renameGroup,
  transferAdmin,
  deleteGroupConversation,
  getConversationAttachments,
};
