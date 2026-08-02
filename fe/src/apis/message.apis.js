import {axiosClient} from "./axiosClient.js";

const getMessages = async (conversationId, beforeOffset, limit) => {
    const response = await axiosClient.get(`/messages?conversationId=${conversationId}&beforeOffset=${beforeOffset}&limit=${limit}`);
    return response.data;
}

const newMessage = async (clientOffset, conversationId, content) => {
    const response = await axiosClient.post("/messages", {
        conversationId, content, clientOffset
    });
    return response.data;
}

const uploadFilesMessage = async (clientOffset, conversationId, files) => {
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("clientOffset", clientOffset);
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }
    const response = await axiosClient.post("/messages/files", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

export default {getMessages, newMessage, uploadFilesMessage};
