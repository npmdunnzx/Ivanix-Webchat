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

const responseRequest = async (senderId, status) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.responseRequest(senderId, status);
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

const cancelRequest = async (receiverId) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.cancelRequest(receiverId);
        response.data = data;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "friend", msg: "Could not cancel friend request" });
        }
    }
    return response;
}

const getMyRequests = async () => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.getMyRequests();
        response.data = data;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "friend", msg: "Could not get my requests" });
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

const deleteFriend = async (friendId) => {
    const response = {
        success: true,
        listErr: [],
        data: null,
    }
    try {
        const data = await friendApis.deleteFriend(friendId);
        response.data = data;
    } catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({ path: "friend", msg: "Could not delete friend" });
        }
    }
    return response;
}

export default {
    sendRequest,
    responseRequest,
    cancelRequest,
    getPendingRequests,
    getMyRequests,
    getFriends,
    deleteFriend
}
