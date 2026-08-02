import messApi from "../apis/message.apis.js";

const getMessages = async (conversationId) => {
    const response = {
        success: true,
        listErr: [],
        data: null
    };

    try {
        const data = await messApi.getMessages(conversationId);
        response.data = data;
        return response;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({path: "message", msg: "Could not get messages"});
        } else {
            console.log("Error getting messages:", error);
        }
    }
}

const newMessage = async (clientOffset , conversationId, senderId, content) => {
    const response = {
        success: true,
        listErr: [],
        data: null
    }; 

    try {
        const data = await messApi.newMessage(clientOffset, conversationId, senderId, content);
        response.data = data;
        return response;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({path: "message", msg: "Could not send message"});
        } else {
            console.log("Error sending message:", error);
        }
    }
}

const uploadFilesMessage = async (clientOffset, conversationId, files) => {
    const response = {
        success: true,
        listErr: [],
        data: null
    };
    try {
        const data = await messApi.uploadFilesMessage(clientOffset, conversationId, files);
        response.data = data;
        return response;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({path: "message", msg: "Could not upload files"});
        } else {
            console.log("Error uploading files:", error);
        }
    }
}

export default {
    getMessages,
    newMessage,
    uploadFilesMessage
}