import {axiosClient} from "./axiosClient.js";

const getAllConversations = async () => {
    const response = await axiosClient.get("/conversations");
    return response.data;
};

const newGroupChat = async (groupName, membersId) => {
    const response = await axiosClient.post("/conversations/groups", {
        groupName, membersId
    });
    return response.data;
}

const addNewMembers = async (conversation_id, membersId) => {
    const response = await axiosClient.post("/conversations/groups/members", {
        conversation_id, membersId
    });
    return response.data;
}

const checkExistChat = async (partnerId) => {
    const response = await axiosClient.post("/conversations/private", {
        partnerId
    });
    return response.data;
}

const searchConversation = async (name) => {
    const response = await axiosClient.get(`/conversations/search?name=${name}`);
    return response.data;
}

const getGroupMembers = async (conversation_id) => {
    const response = await axiosClient.get(`/conversations/groups/${conversation_id}/members`);
    return response.data;
}


export default {getAllConversations, newGroupChat, addNewMembers, checkExistChat, searchConversation, getGroupMembers};