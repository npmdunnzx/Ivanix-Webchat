import {raw} from "express";
import config from "../config/env.config.js";
import friendService from "../services/friend.service.js";

const sendRequest = async (req, res) => {
    const senderId = req.userId;
    const { receiverId } = req.body;
    try {
        const response = await friendService.sendRequest(senderId, receiverId);
        res.status(201).json({ message: "Friend request sent successfully", data: response });
    } catch (error) {
        res.status(400).json({ message: "Could not send friend request", error: error.message });
    }
}

const responseRequest = async (req, res) => {
    const receiverId = req.userId;
    const { senderId, action } = req.body;
    try {
        const response = await friendService.responseRequest(action, senderId, receiverId);
        res.status(200).json({ message: "Friend request response recorded successfully", data: response });
    } catch (error) {
        res.status(400).json({ message: "Could not respond to friend request", error: error.message });
    }
}

const getPendingRequest = async (req, res) => {
    const userId = req.userId;
    try {
        const pendingRequests = await friendService.getPendingRequests(userId);
        res.status(200).json({ message: "Pending friend requests retrieved successfully", data: pendingRequests });
    }
    catch (error) {
        res.status(500).json({ message: "Could not retrieve pending friend requests", error: error.message });
    }
}

const getFriends = async (req, res) => {
    const userId = req.userId;
    try {
        const friends = await friendService.getFriends(userId);
        res.status(200).json({ message: "Friends retrieved successfully", data: friends });
    }
    catch (error) {
        res.status(500).json({ message: "Could not retrieve friends", error: error.message });
    }
}

export default {
    sendRequest,
    responseRequest,
    getPendingRequest,
    getFriends
}