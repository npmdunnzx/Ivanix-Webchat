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
  u.id,
  u.username,
  u.avatar_url,
  CASE
    WHEN fr.status = 'pending' AND fr.sender_id = $1 THEN 'request_sent'
    WHEN fr.status = 'pending' AND fr.receiver_id = $1 THEN 'request_received'
    ELSE 'none'
  END AS rel_status
FROM users u
LEFT JOIN friend_requests fr
  ON fr.status = 'pending'
  AND (
    (fr.sender_id = $1 AND fr.receiver_id = u.id) OR
    (fr.sender_id = u.id AND fr.receiver_id = $1)
  )
LEFT JOIN friendships f
  ON f.user_id1 = LEAST($1, u.id)
  AND f.user_id2 = GREATEST($1, u.id)
WHERE u.id <> $1
  AND u.username ILIKE '%' || $2 || '%' ESCAPE '\'
  AND f.user_id1 IS NULL   -- loại người đã là bạn bè
ORDER BY
  CASE
    WHEN lower(u.username) = lower($2) THEN 1
    WHEN lower(u.username) LIKE lower($2) || '%' THEN 2
    ELSE 3
  END,
  u.username
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

const updateProfile = async (userId, { username, avatar_url }) => {
  try {
    let query = "";
    let params = [];

    if (username && avatar_url) {
      query = "UPDATE users SET username = $1, avatar_url = $2 WHERE id = $3 RETURNING id, username, email, avatar_url";
      params = [username, avatar_url, userId];
    } else if (avatar_url) {
      query = "UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, email, avatar_url";
      params = [avatar_url, userId];
    } else if (username) {
      query = "UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email, avatar_url";
      params = [username, userId];
    } else {
      const getQuery = "SELECT id, username, email, avatar_url FROM users WHERE id = $1";
      const { rows } = await db.query(getQuery, [userId]);
      return rows[0];
    }

    const { rows } = await db.query(query, params);
    return rows[0];
  } catch (error) {
    console.error("Could not update profile:", error.message);
    throw new Error("Could not update profile: " + error.message);
  }
};

export default { profile, search, updateProfile };
