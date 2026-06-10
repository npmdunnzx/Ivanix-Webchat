import {createContext, useContext, useEffect} from "react";
import {socket} from "../services/socket.js";
import { AuthContext } from "./AuthContext.jsx";

export const SocketContext = createContext();

export const SocketProvider = ({children}) => {
    const {userInfo} = useContext(AuthContext);
    useEffect(() => {
        if (userInfo) {
            if (!socket.connected) socket.connect();
            console.log("Socket connected in SocketProvider.");
        }
        return () => {
            if (socket.connected) {
                socket.disconnect();
                console.log("Socket disconnected in SocketProvider.");
            }
        };
    }, [userInfo]);

    return (
        <SocketContext.Provider value={{socket}}>
            {children}
        </SocketContext.Provider>
    );
};

