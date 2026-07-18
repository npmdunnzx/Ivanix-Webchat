import Redis from "ioredis";
import config from "./env.config.js";

const redisClient = new Redis({
  host: config.REDIS.host,
  port: config.REDIS.port,
  password: config.REDIS.password,
});

redisClient.on("connect", () => {
  console.log("Connected to Redis successfully.");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redisClient;