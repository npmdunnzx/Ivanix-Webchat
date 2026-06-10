import authApi from "../apis/auth.apis.js";
import { createContext, useState, useEffect } from "react";
import { socket } from "./socket.js";

const signup = async (userInfo) => {
  const username = userInfo.username;
  const email = userInfo.email;
  const password = userInfo.password;
  
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await authApi.signup(username, email, password);
    
    if (!socket.connected) socket.connect();
    response.data = data;
  } catch (error) {
    response.success = false;
    console.log(error);
    if (error.response && error.response.status === 400) {
      const errors = error.response.data.errors || [];
      errors.forEach((err) => {
        response.listErr.push({
          path: err.path,
          msg: err.msg,
        });
      });
    } else if (error.response && error.response.status === 409) {
      const msg = error.response.data?.message || "Conflict";
      let path = "auth";
      if (/email/i.test(msg)) path = "email";
      else if (/username/i.test(msg)) path = "username";
      response.listErr.push({ path, msg });
    } else {
      console.error(error);
    }
  }
  console.log("response", response);

  return response;
};

const login = async (userInfo, rememberMe) => {
  const email = userInfo.email;
  const password = userInfo.password;
  const response = {
    success: true,
    listErr: [],
    data: null,
  };
  try {
    const data = await authApi.login(email, password, rememberMe);
    if (!socket.connected) socket.connect();
    response.data = data;
  } catch (error) {
    response.success = false;
    console.log(error);
    if (error.response.status === 400) {
      const errors = error.response.data.errors;
      errors.forEach((err) => {
        response.listErr.push({
          path: err.path,
          msg: err.msg,
        });
      });
    } else if (error.response.status === 401) {
      const errors = error.response.data.errors;
      console.log(error.response);
      response.listErr.push({
        path: "auth",
        msg: "Invalid Credential",
      });
    } else console.error(error);
  }
  console.log("response", response);

  return response;
};

export default { signup, login };
