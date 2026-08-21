import {axiosClient} from "./axiosClient.js";

const sendRequest = async (receiverId) => {
    const response = await axiosClient.post("/friends/send-request", {receiverId});
    return response.data;
}

const responseRequest = async (senderId, action) => {
    const response = await axiosClient.post("/friends/response-request", {senderId, action});
    return response.data;
}

const getPendingRequests = async () => {
    const response = await axiosClient.get("/friends/pending-requests");
    return response.data;
}

const getFriends = async () => {
    const response = await axiosClient.get("/friends");
    return response.data;
}

const cancelRequest = async (receiverId) => {
    const response = await axiosClient.post("/friends/cancel-request", {receiverId});
    return response.data;
}

const getMyRequests = async () => {
    const response = await axiosClient.get("/friends/my-requests");
    return response.data;
}

const deleteFriend = async (friendId) => {
    const response = await axiosClient.delete("/friends/delete-friend", { data: { friendId } });
    return response.data;
}

export default {
    sendRequest,
    responseRequest,
    cancelRequest,
    deleteFriend,
    getMyRequests,
    getPendingRequests,
    getFriends
}