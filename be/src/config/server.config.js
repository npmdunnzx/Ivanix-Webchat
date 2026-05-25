import express from "express";
import { createServer } from "node:http";
import {Server} from "socket.io";
import cors from "cors";
import config from "./env.config.js";
import db from "./db.config.js";
import {socketAuth} from "../middlewares/socketAuth.js";
import authRoutes from "../routes/auth.routes.js";

const app = express();
app.use(express.json());
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

app.use("/api/auth", authRoutes);

const httpServer = createServer(app);


const io = new Server(httpServer, {
    connectionStateRecovery: {},
    cors: {
        origin: config.CLIENT_URL,
        credentials: true,
    },
});

// io.on("connection", async (socket) => {
//   console.log("A user connected: " + socket.id);

//   const sender = socket.handshake.auth.username || "Anonymous";
//   const initialRoomName = socket.handshake.auth.roomName || "general";

//   socket.data.roomName = initialRoomName;
//   socket.join(initialRoomName);

//   socket.on("join room", (roomName) => {
//     const nextRoomName = roomName || "general";

//     socket.data.roomName = nextRoomName;
//     socket.join(nextRoomName);
//     console.log(`${sender} joined room: ${nextRoomName}`);
//   });

//   socket.on("chat message", async (msg, roomName, clientOffset, callback) => {
//     let result;
//     const targetRoomName = roomName || socket.data.roomName || "general";

//     console.log("chat message received:", {
//       msg,
//       roomName: targetRoomName,
//       clientOffset,
//       sender,
//     });

//     try {
//       result = await db.query(
//         `
//         INSERT INTO messages (client_offset, content, sender_name, room_name)
//         VALUES ($1, $2, $3, $4)
//         RETURNING server_offset
//         `,
//         [clientOffset, msg, sender, targetRoomName]
//       );
//     } catch (error) {
//       if (error.code === "23505") {
//         callback?.();
//       }

//       console.error("Cannot save chat message:", error);
//       return;
//     }

//     const serverOffset = result.rows[0].server_offset;

//     console.log("chat message saved:", {
//       roomName: targetRoomName,
//       sender,
//       serverOffset,
//     });

//     io.to(targetRoomName).emit("chat message", msg, sender, serverOffset);
//     callback?.(serverOffset);
//   });

//   if (!socket.recovered) {
//     try {
//       const result = await db.query(
//         `
//         SELECT server_offset, content, sender_name
//         FROM messages
//         WHERE room_name = $1 AND server_offset > $2
//         ORDER BY server_offset ASC
//         `,
//         [socket.data.roomName, socket.handshake.auth.serverOffset || 0]
//       );

//       result.rows.forEach((row) => {
//         socket.emit("chat message", row.content, row.sender_name, row.server_offset);
//       });
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   socket.on("disconnect", () => {
//     console.log("A user disconnected: " + socket.id);
//   });
// });
export {io, httpServer, app};
