import {axiosClient} from "./axiosClient.js";

const getRecommendation = async (userId) => {
    const response = await axiosClient.get(`/recommendations?userId=${userId}`);
    return response.data;
}

export default {getRecommendation};