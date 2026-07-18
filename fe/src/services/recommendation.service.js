import recommendationApis from "../apis/recommendation.apis.js";

const getRecommendation = async (userId) => {
    const response = {
        success: true,
        listErr: [],
        data: null
    };
    try {
        const data = await recommendationApis.getRecommendation(userId);
        response.data = data;
        return response;
    }
    catch (error) {
        response.success = false;
        if (error.response && error.response.status === 500) {
            response.listErr.push({path: "recommendation", msg: "Could not get recommendation"});
        } else {
            console.log("Error getting recommendation:", error);
        }
    }
}

export default {
    getRecommendation,
}