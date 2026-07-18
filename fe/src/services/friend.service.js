import friendApis from "../apis/friend.apis.js";

const sendRequest = async (receiverId) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.sendRequest(receiverId);
        response.data = data;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "friend", msg: "Could not send friend request" });
        }
    }
    return response;
};

const responseRequest = async (requestId, status) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.responseRequest(requestId, status);
        response.data = data;
    }
    catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "friend", msg: "Could not respond to friend request" });
        }
    }
    return response;
}

const getPendingRequests = async () => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.getPendingRequests();
        response.data = data;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "friend", msg: "Could not get pending requests" });
        }
    }
    return response;
}

const getFriends = async () => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.getFriends();
        response.data = data;
    }
    catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "friend", msg: "Could not get friends" });
        }
    }
    return response;
}

export default {
    sendRequest,
    responseRequest,
    getPendingRequests,
    getFriends
}
