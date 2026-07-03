const userSocketMap = {};

const getOnlineUserIds = () => Object.keys(userSocketMap);

const getUserSockets = (userId) => {
  return userSocketMap[userId] || [];
};

const registerPresenceHandlers = (io, socket) => {
  const userId = socket.userId;

  userSocketMap[userId] = userSocketMap[userId] || [];
  userSocketMap[userId].push(socket.id);

  io.emit("getOnlineUsers", getOnlineUserIds());

  socket.on("disconnect", () => {
    userSocketMap[userId] = userSocketMap[userId].filter(
      (socketId) => socketId !== socket.id
    );

    if (userSocketMap[userId].length === 0) {
      delete userSocketMap[userId];
    }
    
    io.emit("getOnlineUsers", getOnlineUserIds());
  });
};

export { registerPresenceHandlers, getUserSockets, getOnlineUserIds };