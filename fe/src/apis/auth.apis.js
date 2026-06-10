import { axiosClient } from "./axiosClient.js";

const signup = async (username, email, password) => {
    const response = await axiosClient.post("/auth/signup", {
        username, email, password
    });
    return response.data;    
};


const login = async (email, password, rememberMe) => {
    const response = await axiosClient.post("/auth/login", {
        email, password, rememberMe
    });
    return response.data;
}


export default {signup, login};