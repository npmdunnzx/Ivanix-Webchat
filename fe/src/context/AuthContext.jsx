import userApi from "../apis/user.apis.js";
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
    return (
    <AuthContext.Provider value = {{userInfo, loading, setUserInfo}}>
        {children}
    </AuthContext.Provider> );
};