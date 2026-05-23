import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "development";

const config = {
  DB_URL: process.env.DB_URL,
  // JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 4000,
  CLIENT_URL: (process.env.CLIENT_URL || "").trim(),
  DB: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};

export default config;
