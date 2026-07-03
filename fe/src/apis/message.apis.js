import {axiosClient} from "./axiosClient.js";

const getMessages = async (conversationId, beforeOffset, limit) => {
    const response = await axiosClient.get(`/messages?conversationId=${conversationId}&beforeOffset=${beforeOffset}&limit=${limit}`);
    return response.data;
}

const newMessage = async (clientOffset, conversationId, senderId, content) => {
    const response = await axiosClient.post("/messages", {
        conversationId, content, clientOffset
    });
    return response.data;
}

export default {getMessages, newMessage};
