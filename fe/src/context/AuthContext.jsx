import userApi from "../apis/user.apis.js";
import authApi from "../apis/auth.apis.js";
// import { socket } from "../services/socket.js";
import {createContext, useState, useEffect} from "react";
export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=> {
        const fetchData = async () => {
            try {
                const data = await userApi.profile();
                setUserInfo(data);
            } catch (error) {
                setUserInfo(null);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // if (socket.connected) {
            //     socket.disconnect();
            // }
            setUserInfo(null);
        }
    };

    return (
    <AuthContext.Provider value = {{userInfo, loading, setUserInfo, logout}}>
        {children}
    </AuthContext.Provider> );
};