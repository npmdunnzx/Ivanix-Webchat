import { io } from "socket.io-client";
import { API_BASE } from "../apis/axiosClient.js";

//Socket Module with singleton pattern
export const socket = io(API_BASE, {
  withCredentials: true,
  autoConnect: false,
});