import recommendationService from "../services/recommendation.service.js";
const { getRecommendations } = recommendationService;

const getRecommendation = async (req, res) => {
    const userId = req.userId;
    try {
        const recommendations = await getRecommendations(userId);
        res.status(200).json({ message: "Recommendations retrieved successfully", data: recommendations });
    }
    catch (error) {
        res.status(500).json({ message: "Could not retrieve recommendations", error: error.message });
    }
}

export default {
    getRecommendation
}