import {createContext, useContext, useEffect, useState} from "react";
import {socket} from "../services/socket.js";
import { AuthContext } from "./AuthContext.jsx";

export const SocketContext = createContext();

export const SocketProvider = ({children}) => {
    const {userInfo} = useContext(AuthContext);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!userInfo) return;

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            if (socket.connected) {
                socket.disconnect();
            }
        };
    }, [userInfo?.id]);

    useEffect(() => {
        const handleOnlineUsers = (userIds) => setOnlineUsers(userIds.map(String));

        // Gắn listener TRƯỚC khi socket có thể nhận event
        socket.on("getOnlineUsers", handleOnlineUsers);

        // Khi socket vừa (re)connect, backend đã tự broadcast getOnlineUsers.
        // Nhưng nếu listener chưa kịp gắn (lần đầu load), yêu cầu lại snapshot để chắc chắn.
        const handleConnect = () => {
            socket.emit("presence:sync");
        };
        socket.on("connect", handleConnect);

        // Nếu socket đã connect rồi (ví dụ hot-reload), request ngay
        if (socket.connected) {
            socket.emit("presence:sync");
        }

        return () => {
            socket.off("getOnlineUsers", handleOnlineUsers);
            socket.off("connect", handleConnect);
        };
    }, []);

    const isUserOnline = (userId) => {
        if (!userId) return false;
        return onlineUsers.includes(String(userId));
    };
    // useEffect(() => {
    //     console.log("onlineUsers updated:", onlineUsers);
    // }, [onlineUsers]);
    return (
        <SocketContext.Provider value={{socket, onlineUsers, isUserOnline}}>
            {children}
        </SocketContext.Provider>
    );
};

