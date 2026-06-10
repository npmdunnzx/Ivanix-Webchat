import axios from "axios";
export const API_BASE =  "http://localhost:4000";
export const axiosClient = axios.create({
    baseURL: API_BASE + "/api",
    withCredentials: true,
    headers:{
        "Content-Type":"application/json"
    }
})