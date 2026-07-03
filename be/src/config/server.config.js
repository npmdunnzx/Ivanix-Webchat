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
import convRoutes from "../routes/conversation.routes.js";
import messRoutes from "../routes/message.routes.js";
import {registerSocketHandlers} from "../sockets/index.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/conversations", convRoutes);
app.use("/api/messages", messRoutes);

const httpServer = createServer(app);


const io = new Server(httpServer, {
    connectionStateRecovery: {},
    cors: {
        origin: config.CLIENT_URL,
        credentials: true,
    },
});

io.use(socketAuth);

io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);
})

export {io, httpServer, app};
