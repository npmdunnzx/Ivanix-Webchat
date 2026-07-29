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

const addNewMembers = async (conversation_id, membersId) => {
  const response = await axiosClient.post("/conversations/groups/members", {
    conversation_id,
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

const getGroupMembers = async (conversation_id) => {
  const response = await axiosClient.get(
    `/conversations/groups/${conversation_id}/members`,
  );
  return response.data;
};

const leaveConversation = async (conversation_id) => {
  const response = await axiosClient.post("/conversations/leave", {
    conversation_id,
  });
  return response.data;
};

const delConversationHistory = async (conversation_id, user_id) => {
  const response = await axiosClient.post(
    `/conversations/${conversation_id}/history`,
    {
      data: { user_id },
    }
  );
  return response.data;
};

const removeGroupMember = async (conversation_id, target_user_id) => {
  const response = await axiosClient.post(
    "/conversations/groups/members/remove",
    {
      conversation_id,
      target_user_id,
    },
  );
  return response.data;
};

const renameGroup = async (conversation_id, group_name) => {
  const response = await axiosClient.put("/conversations/groups/name", {
    conversation_id,
    group_name,
  });
  return response.data;
};

const transferAdmin = async (conversation_id, new_admin_id) => {
  const response = await axiosClient.put("/conversations/groups/admin", {
    conversation_id,
    new_admin_id,
  });
  return response.data;
};

const deleteGroupConversation = async (conversation_id) => {
  const response = await axiosClient.delete(`/conversations/groups/${conversation_id}`);
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
};
