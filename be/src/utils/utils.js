import jwt from "jsonwebtoken";
import config from "../config/env.config.js";
import dayjs from "dayjs";

const countTodayBooking = (bookings) => {
  const today = dayjs().format("YYYY-MM-DD");
  return bookings.filter((b) => b.date === today).length;
};

const generateToken = (email, userId, rememberMe, res) => {
  console.log();
  
  const token = jwt.sign({ email, userId }, config.JWT.secret, {
    expiresIn: rememberMe ? "30d" : config.JWT.expiresIn,
  });

  res.cookie("token", token, {
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : Number(config.JWT.expiresIn.replace("d", "")) * 24 * 60 * 60 * 1000, //mili second,
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  // console.log("Generated JWT token:", token);
  return token;
};

export default { countTodayBooking, generateToken };
