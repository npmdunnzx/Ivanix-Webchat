import db from "../config/db.config.js";
import config from "../config/env.config.js";
import utils from "../utils/utils.js";

const getAllConversations = async (userId) => {
  const query = `
        SELECT
            c.id, c.type, c.name, c.last_message_at, c.last_message_sender_id,
            c.last_message_id, cm.unread_count,

            m.content AS last_message_content,
            m.message_type AS last_message_type,

            partner.id AS partner_id,
            partner.username AS partner_username,
            partner.avatar_url AS partner_avatar

        FROM conversation_members cm
        JOIN conversations c ON c.id = cm.conversation_id
        LEFT JOIN messages m ON m.id = c.last_message_id
        LEFT JOIN conversation_members cm2
            ON cm2.conversation_id = c.id
            AND cm2.user_id != $1
            AND c.type = 'private'
        LEFT JOIN users partner ON partner.id = cm2.user_id

        WHERE cm.user_id = $1
        ORDER BY c.last_message_at DESC NULLS LAST
        LIMIT 50
    `;
  try {
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error("Could not get conversations:", error.message);
    throw new Error("Could not get conversations:", error.message);
  }
};

const generateParticipantKey = (userId, partnerId) => {
  return [userId, partnerId].sort().join(":");
};

const newGroupChat = async (groupName, adminId, membersId) => {
    const client = await db.getClient();
    const query1 = `
        INSERT INTO conversations (type, name)
        VALUES ('group', $1) RETURNING id`;
    const query2 = `
        INSERT INTO conversation_members (conversation_id, user_id)
        SELECT $1, UNNEST($2::uuid[])`;
    const query3 = `
        UPDATE conversation_members SET role = 'admin'
        WHERE conversation_id = $1 AND user_id = $2`;
    try {
        await client.query("BEGIN");

        const {rows} = await client.query(query1, [groupName]);
        const conversationId = rows[0].id;

        const members = [adminId, ...membersId];
        await client.query(query2, [conversationId, members]);

        await client.query(query3, [conversationId, adminId]);

        await client.query("COMMIT");
        return {conversationId, created: true};
    } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(error.message);
    } finally {
        client.release();
    }
}

const addNewMembers = async (conversation_id, membersId) => {
    const query = `
    INSERT INTO conversation_members (conversation_id, user_id)
    SELECT $1, UNNEST($2::uuid[])`;
    try {
        const {rows} = await db.query(query, [conversation_id, membersId]);
        return rows;
    } catch (error) {
        console.error("Could not add new members:", error.message);
        throw new Error("Could not add new members:", error.message);
    }
}

const newPrivateChat = async (participant_key, userId, partnerId) => {
  const createQuery1 = `
            INSERT INTO conversations (type,participant_key) 
            VALUES ('private', $1) RETURNING id`;
  const createQuery2 = `
            INSERT INTO conversation_members (conversation_id, user_id)
            VALUES ($1, $2), ($1, $3)`;
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(createQuery1, [participant_key]);
    const conversation_id = rows[0].id;

    await client.query(createQuery2, [conversation_id, userId, partnerId]);
    await client.query("COMMIT");
    return { conversationId: conversation_id, created: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(error.message);
  } finally {
    client.release();
  }
};

const checkExistChat = async (userId, partnerId) => {
  const key = generateParticipantKey(userId, partnerId);
  const query = `
        SELECT id FROM conversations
        WHERE participant_key = $1
    `;
  try {
    const { rows } = await db.query(query, [key]);
    if (rows.length > 0) {
      return { conversationId: rows[0].id, created: false };
    }
    const result = await newPrivateChat(key, userId, partnerId);
    return result;
  } catch (error) {
    console.error("Could not check exist chat:", error.message);
    throw new Error("Could not check exist chat:", error.message);
  }
};

const searchGroupByName = async (userId, name) => {
  const query = `
    SELECT
      c.id, c.type, c.name, c.last_message_at,
      c.last_message_sender_id, c.last_message_id
    FROM conversation_members cm
    JOIN conversations c ON c.id = cm.conversation_id
    WHERE cm.user_id = $1
      AND c.type = 'group'
      AND c.name ILIKE '%' || $2 || '%'
    ORDER BY
      CASE
        WHEN lower(c.name) = lower($2) THEN 1
        WHEN lower(c.name) LIKE lower($2) || '%' THEN 2
        ELSE 3
      END,
      c.name
    LIMIT 15`;
  try {
    const { rows } = await db.query(query, [userId, name]);
    return rows;
  } catch (error) {
    console.error("Could not get conversation by name:", error.message);
    throw new Error("Could not get conversation by name: " + error.message);
  }
};

const getGroupMembers = async (conversationId) => {
  const query = `
    SELECT u.id, u.username, u.avatar_url, cm.role
    FROM conversation_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.conversation_id = $1
  `;
  try {
    const { rows } = await db.query(query, [conversationId]);
    return rows;
  } catch (error) {
    console.error("Could not get group members:", error.message);
    throw new Error("Could not get group members: " + error.message);
  }
};

export default { getAllConversations, checkExistChat, newPrivateChat, newGroupChat, addNewMembers, searchGroupByName, getGroupMembers };
