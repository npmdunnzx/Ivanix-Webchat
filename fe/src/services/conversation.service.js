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
            response.listErr.push({ path: "conversation", msg: "Could not get conversations" });
        } else {
            console.error("Error getting conversations:", error);
        }
    }
    return response;
}

const newGroupChat = async (groupName, membersId) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    };
    try {        
        const data = await convApi.newGroupChat(groupName, membersId);
        response.data = data;
    }
    catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "conversation", msg: "Could not create group chat" });
        } else {
            console.error("Error creating group chat:", error);
        }
    }
    return response;
}

const addNewMembers = async (conversation_id, membersId) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    };
    try {        
        const data = await convApi.addNewMembers(conversation_id, membersId);
        response.data = data;
    }
    catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "conversation", msg: "Could not add new members" });
        } else {
            console.error("Error adding new members:", error);
        }
    }
    return response;
}

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
            response.listErr.push({ path: "conversation", msg: "Could not check exist chat" });
        } else {
            console.error("Error checking exist chat:", error);
        }
    }
    return response;
}

const searchGroupByName = async (name) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    };
    try {
        const data = await convApi.searchGroupByName(name);
        response.data = data;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "conversation", msg: "Could not search group chat" });
        }
        else {
            console.error("Error searching group chat:", error);
        }
    }
    return response;
}

export default {getAllConversations, newGroupChat, addNewMembers, checkExistChat, searchGroupByName};
