import {axiosClient} from "./axiosClient.js";

const profile = async (email) => {
    const response = await axiosClient.get("/user/me", {email});
    return response.data;
}

const search = async (userId, keyword) => {
    const response = await axiosClient.get("/user/search", {
        userId, keyword
    });
    return response.data;
}

export default { profile, search}