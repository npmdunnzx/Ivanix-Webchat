import jwt from "jsonwebtoken";
import config from "../config/env.config.js";

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];
      if (!token){
        console.log("Socket connection rejected: No token provied");
        return next(new Error("Unauthorized - No Token Provide"));
      }
      const decode = jwt.verify(token,config.JWT.secret);
      if (!decode){
        console.log("Socket connection rejected: Invalid Token");
        return next(new Error("Unauthorized - Invalid Token"));
      }
      socket.userId=decode.userId;
      console.log(`Socket authenticated for user have email is ${decode.email}`);
      next();
  } catch (Err) {
    console.log("Error in socket authentication: ", Err.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};
export {socketAuth}