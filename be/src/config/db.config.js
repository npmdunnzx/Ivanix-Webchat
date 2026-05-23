import { Pool } from "pg";
import config from "./env.config.js";

const pool = new Pool({
  host: config.DB.host,
  port: config.DB.port,
  user: config.DB.username,
  password: config.DB.password,
  database: config.DB.database,
});

const connect = async () => {
  try {
    await pool.connect();
    console.log("Connected to the database successfully.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
};

const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

export default { connect, query };
