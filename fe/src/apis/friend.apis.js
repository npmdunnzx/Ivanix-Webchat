import {axiosClient} from "./axiosClient.js";

const sendRequest = async (targetId) => {
    const response = await axiosClient.post("/friends/send-request", {targetId});
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

export default {
    sendRequest,
    responseRequest,
    getPendingRequests,
    getFriends
}