import { query } from "express";
import db from "../config/db.config.js";
import config from "../config/env.config.js";
import utils from "../utils/utils.js";

const profile = async (email) => {
  const query =
    "SELECT id, username, email, avatar_url FROM users WHERE email = $1";
  try {
    const { rows } = await db.query(query, [email]);
    return rows[0];
  } catch (error) {
    console.error("Could not get profile:" + error.message);
    throw new Error("Could not get profile:", error);
  }
};

const search = async (userId, keyword) => {
  const safeKeyword = utils.escapeLikePattern(keyword);
  const query = `SELECT
        id,
        username,
        avatar_url
        FROM users
        WHERE id <> $1
        AND username ILIKE '%' || $2 || '%' ESCAPE '\\'
        ORDER BY
        CASE
            WHEN lower(username) = lower($2) THEN 1
            WHEN lower(username) LIKE lower($2) || '%' THEN 2
            ELSE 3
        END,
        username
        LIMIT 15;`;
  try {
    const { rows } = await db.query(query, [userId, safeKeyword]);
    // console.log(rows);
    return rows;
  } catch (err) {
    console.log("Could not search:", err.message);
    throw new Error("Could not search:", err.message);
  }
};

export default { profile, search };
