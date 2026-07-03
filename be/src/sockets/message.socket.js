import messService from "../services/message.service.js";

const registerMessageHandlers = (io, socket) => {
    socket.on("message:send", async (payload, callback) => {
        console.log("Receive msg: \n", payload)
        try {
            const message = await messService.newMessage(
                payload.clientOffset ?? null,
                payload.conversationId,
                payload.senderId,
                payload.content
            );
            console.log("message", message)
            io.to(`conversation:${payload.conversationId}`).emit("message:new", message);
            console.log(callback);
            callback?.({success: true, listErr: [], data: message});
        } catch (error) {
            callback?.({success: false, message: error.message});
        }
    })
}

export {registerMessageHandlers};