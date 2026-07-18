import {axiosClient} from "./axiosClient.js";

const profile = async (email) => {
    const response = await axiosClient.get("/user/me", {email});
    return response.data;
}

const search = async (keyword) => {
    const response = await axiosClient.get("/user/search?keyword=" + keyword);
    return response.data;
}

export default { profile, search}