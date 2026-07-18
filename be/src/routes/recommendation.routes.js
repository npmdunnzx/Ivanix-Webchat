import recommendationController from '../controller/recommendation.controller.js';
import express from 'express';
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

router.get('/', protectRoute, recommendationController.getRecommendation);

export default router;