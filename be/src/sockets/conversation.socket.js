const registerConvHandlers = (io, socket) => {
    socket.on("conversation:join", (conversationId) => {
        console.log(`Join room ${conversationId} successfully`);
        socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId) => {
        console.log(`Leaved room ${conversationId}`);
        socket.leave(`conversation:${conversationId}`)
    })

}

export {registerConvHandlers};