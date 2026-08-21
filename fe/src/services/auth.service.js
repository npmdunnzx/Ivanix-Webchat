import authApi from "../apis/auth.apis.js";
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
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((err) => {
          response.listErr.push({
            path: err.path,
            msg: err.msg,
          });
        });
      } else if (errorData.message) {
        response.listErr.push({
          path: "general",
          msg: errorData.message,
        });
      }
    } else {
      response.listErr.push({
        path: "general",
        msg: "Đăng nhập thất bại. Vui lòng thử lại sau.",
      });
    }
  }
  console.log("response", response);

  return response;
};

export default { signup, login };
