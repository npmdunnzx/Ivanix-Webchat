import {registerPresenceHandlers} from "./presence.socket.js";
import {registerConvHandlers} from "./conversation.socket.js";
import {registerMessageHandlers} from "./message.socket.js";
const registerSocketHandlers = (io, socket) => {
    registerPresenceHandlers(io, socket);
    registerConvHandlers(io, socket);
    registerMessageHandlers(io, socket);
}

export {registerSocketHandlers};