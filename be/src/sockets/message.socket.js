import messService from "../services/message.service.js";

const registerMessageHandlers = (io, socket) => {
    socket.on("message:send", async (payload, callback) => {
        const senderId = socket.userId;
        try {
            const message = await messService.newMessage(
                payload.clientOffset ?? null,
                payload.conversationId,
                senderId,
                payload.content
            );
            io.to(`conversation:${payload.conversationId}`).emit("message:new", message);
            // console.log(callback);
            callback?.({success: true, listErr: [], data: message});
        } catch (error) {
            callback?.({success: false, message: error.message});
        }
    })
}

export {registerMessageHandlers};