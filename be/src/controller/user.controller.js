import {raw} from "express";
import config from "../config/env.config.js";
import userService from "../services/user.service.js";

const profile = async (req, res) => {
    const email = req.email;
    try {
        const result = await userService.profile(email);
        res.status(200).json(result);
    }
    catch (err) {
        console.error("Get profile error", err.message);
        res.status(500).json({message: "Internal server error",error: err.message});
    }
}

const search = async (req, res) => {
    const id = req.userId;
    const keyword = req.query.keyword;
    try {
        const result = await userService.search(id, keyword);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({message: "Internal server error",error: error.message});
    }
}

export default {profile, search};