import {raw} from "express";
import authService from "../services/auth.service.js";
import utils from "../utils/utils.js";
import crypto from "crypto";
import config from "../config/env.config.js";

const signup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = await authService.signup(username, email, password);
        
        utils.generateToken(user.email, user.id, false, res);
        res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Could not signup", error: error.message });
    }
};

const login = async (req, res) => {
    const {email, password, rememberMe} = req.body;
    try {
        const user = await authService.login(email, password );
        utils.generateToken(user.email, user.id, rememberMe, res);
        res.status(201).json({message: "Login successfully", user});
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Could not login", error: error.message });
    }
}

const logout = async ( _, res) => {
    res.cookie("jwt", "", {maxAge : 0});
    res.status(200).json({message: "Logout successfully"});
}



export default {signup, login};