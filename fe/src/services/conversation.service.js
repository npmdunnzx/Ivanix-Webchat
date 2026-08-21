import convApi from "../apis/conversation.apis.js";
// import { socket } from "./socket.js";

const getAllConversations = async () => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };

  try {
    const data = await convApi.getAllConversations();
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not get conversations",
      });
    } else {
      console.error("Error getting conversations:", error);
    }
  }
  return response;
};

const newGroupChat = async (groupName, membersId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.newGroupChat(groupName, membersId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not create group chat",
      });
    } else {
      console.error("Error creating group chat:", error);
    }
  }
  return response;
};

const addNewMembers = async (conversationId, membersId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.addNewMembers(conversationId, membersId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not add new members",
      });
    } else {
      console.error("Error adding new members:", error);
    }
  }
  return response;
};

const checkExistChat = async (partnerId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.checkExistChat(partnerId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not check exist chat",
      });
    } else {
      console.error("Error checking exist chat:", error);
    }
  }
  return response;
};

const searchConversation = async (keyword) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.searchConversation(keyword);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not search conversation",
      });
    } else {
      console.error("Error searching conversation:", error);
    }
  }
  return response;
};

const getGroupMembers = async (conversationId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.getGroupMembers(conversationId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not get group members",
      });
    } else {
      console.error("Error getting group members:", error);
    }
  }
  return response;
};

const leaveConversation = async (conversationId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.leaveConversation(conversationId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not leave conversation",
      });
    } else {
      console.error("Error leaving conversation:", error);
    }
  }
  return response;
};

const delConversationHistory = async (conversationId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.delConversationHistory(conversationId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not delete conversation",
      });
    } else {
      console.error("Error deleting conversation:", error);
    }
  }
  return response;
};

const removeGroupMember = async (conversationId, targetUserId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.removeGroupMember(
      conversationId,
      targetUserId,
    );
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 403) {
      response.listErr.push({
        path: "conversation",
        msg: "Chỉ Admin mới có quyền xóa thành viên",
      });
    } else if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not remove member",
      });
    } else {
      console.error("Error removing member:", error);
    }
  }
  return response;
};

const renameGroup = async (conversationId, groupName) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.renameGroup(conversationId, groupName);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not rename group",
      });
    } else {
      console.error("Error renaming group:", error);
    }
  }
  return response;
};

const transferAdmin = async (conversationId, newAdminId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.transferAdmin(conversationId, newAdminId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response?.status === 403) {
      response.listErr.push({
        path: "conversation",
        msg: error.response.data.message || "Chỉ Admin mới có quyền chuyển quyền",
      });
    } else {
      response.listErr.push({ path: "conversation", msg: "Could not transfer admin" });
    }
  }
  return response;
};

const deleteGroupConversation = async (conversationId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.deleteGroupConversation(conversationId);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response?.status === 403) {
      response.listErr.push({
        path: "conversation",
        msg: "Chỉ Admin mới có quyền giải tán nhóm",
      });
    } else {
      response.listErr.push({ path: "conversation", msg: "Could not delete group" });
    }
  }
  return response;
};

const getConversationAttachments = async (conversationId, type) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.getConversationAttachments(conversationId, type);
    response.data = data;
  } catch (error) {
    response.success = false;
    if (error.response && error.response.status === 500) {
      response.listErr.push({
        path: "conversation",
        msg: "Could not get attachments",
      });
    } else {
      console.error("Error getting attachments:", error);
    }
  }
  return response;
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
