import jwt from "jsonwebtoken";
import config from "../config/env.config.js";

export const protectRoute = (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    // console.log("token:", token);
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }
    const decode = jwt.verify(token, config.JWT.secret);
    // ("decode", decode);
    req.email = decode.email;
    req.userId = decode.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Token expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    if (error.name === "NotBeforeError") {
      return res
        .status(401)
        .json({ message: "Unauthorized - Token not active yet" });
    }

    return res.status(500).json({ message: "Internal server error!" });
  }
};
