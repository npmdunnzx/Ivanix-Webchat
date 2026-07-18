import db from "../config/db.config.js";

const registerConvHandlers = (io, socket) => {
  socket.on("conversation:join", async (conversationId, callback) => {
    const userId = socket.userId;
    try {
      const { rows } = await db.query(
        "SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2",
        [conversationId, userId],
      );
      if (rows.length === 0) {
        throw new Error("You are not a member of this conversation");
      }
      console.log(`Join room ${conversationId} successfully`);
      socket.join(`conversation:${conversationId}`);
      callback?.({ success: true });
    } catch (error) {
      console.error("Error joining conversation:" + error.message);
      callback?.({ success: false, message: "Internal server error" });
    }
  });

  socket.on("conversation:leave", (conversationId) => {
    console.log(`Leaved room ${conversationId}`);
    socket.leave(`conversation:${conversationId}`);
  });
};

export { registerConvHandlers };
