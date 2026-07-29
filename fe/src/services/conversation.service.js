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

const addNewMembers = async (conversation_id, membersId) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.addNewMembers(conversation_id, membersId);
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

const getGroupMembers = async (conversation_id) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.getGroupMembers(conversation_id);
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

const leaveConversation = async (conversation_id) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.leaveConversation(conversation_id);
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

const delConversationHistory = async (conversation_id) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.delConversationHistory(conversation_id);
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

const removeGroupMember = async (conversation_id, target_user_id) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.removeGroupMember(
      conversation_id,
      target_user_id,
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

const renameGroup = async (conversation_id, group_name) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.renameGroup(conversation_id, group_name);
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

const transferAdmin = async (conversation_id, new_admin_id) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.transferAdmin(conversation_id, new_admin_id);
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

const deleteGroupConversation = async (conversation_id) => {
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await convApi.deleteGroupConversation(conversation_id);
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
