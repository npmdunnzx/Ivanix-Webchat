import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import {Server} from "socket.io";
import cors from "cors";
import config from "./env.config.js";
import db from "./db.config.js";
import {socketAuth} from "../middlewares/socketAuth.js";
import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

const httpServer = createServer(app);


const io = new Server(httpServer, {
    connectionStateRecovery: {},
    cors: {
        origin: config.CLIENT_URL,
        credentials: true,
    },
});

io.use(socketAuth);

const userSocketMap={};
io.on("connection",(socket)=>{
    const userId=socket.userId;
    console.log("A user connected", userId);
    console.log("Client connected:", socket.id);
    userSocketMap[userId]=userSocketMap[userId]||[];
    userSocketMap[userId].push(socket.id);

    io.emit("getOnlineUsers",Object.keys(userSocketMap));
    console.log("Online users:",Object.keys(userSocketMap));
    socket.on("disconnect",()=>{
        console.log("A user disconnected", socket.userId);
        userSocketMap[userId]=userSocketMap[userId].filter(id=>id!==socket.id);
        if (userSocketMap[userId].length===0){
            delete userSocketMap[userId];
        }
       io.emit("getOnlineUsers",Object.keys(userSocketMap));
    })
})
 function getUserSockets(userId){
    return userSocketMap[userId];
}

export {io, httpServer, app};
