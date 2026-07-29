import db from "../config/db.config.js";
import config from "../config/env.config.js";
import utils from "../utils/utils.js";

const getAllConversations = async (userId) => {
  const query = `
        SELECT
            c.id, c.type, c.name, c.last_message_at, c.last_message_sender_id,
            c.last_message_id, c.created_at, cm.unread_count,

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
        ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
        LIMIT 50
    `;
  try {
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error("Could not get conversations:" + error.message);
    throw new Error("Could not get conversations:" + error.message);
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

    const { rows } = await client.query(query1, [groupName]);
    const conversationId = rows[0].id;

    const members = [adminId, ...membersId];
    await client.query(query2, [conversationId, members]);

    await client.query(query3, [conversationId, adminId]);

    await client.query("COMMIT");
    return {
      id: conversationId,
      conversationId,
      name: groupName,
      type: "group",
      created: true,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(error.message);
  } finally {
    client.release();
  }
};

const addNewMembers = async (conversation_id, membersId) => {
  const query = `
    INSERT INTO conversation_members (conversation_id, user_id)
    SELECT $1, UNNEST($2::uuid[])`;
  try {
    const { rows } = await db.query(query, [conversation_id, membersId]);
    return rows;
  } catch (error) {
    console.error("Could not add new members:" + error.message);
    throw new Error("Could not add new members:" + error.message);
  }
};

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
    console.error("Could not check exist chat:" + error.message);
    throw new Error("Could not check exist chat:" + error.message);
  }
};

const searchConversation = async (userId, keyword) => {
  const safeKeyword = utils.escapeLikePattern(keyword);
  const query = `
    SELECT
      c.id, c.type, c.name,
      c.last_message_at, c.last_message_sender_id, c.last_message_id,
      cm.unread_count,
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
      AND (
        (c.type = 'group' AND c.name ILIKE '%' || $2 || '%' ESCAPE '\\')
        OR
        (c.type = 'private' AND partner.username ILIKE '%' || $2 || '%' ESCAPE '\\')
      )
    ORDER BY
      CASE
        WHEN c.type = 'group' AND lower(c.name) = lower($2) THEN 1
        WHEN c.type = 'private' AND lower(partner.username) = lower($2) THEN 1
        WHEN c.type = 'group' AND lower(c.name) LIKE lower($2) || '%' THEN 2
        WHEN c.type = 'private' AND lower(partner.username) LIKE lower($2) || '%' THEN 2
        ELSE 3
      END,
      c.last_message_at DESC NULLS LAST,
      c.name,
      partner.username`;
  try {
    const { rows } = await db.query(query, [userId, safeKeyword]);
    return rows;
  } catch (error) {
    console.error("Could not search conversations:" + error.message);
    throw new Error(`Could not search conversations: ${error.message}`);
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
    console.error("Could not get group members:" + error.message);
    throw new Error("Could not get group members: " + error.message);
  }
};

const leaveConversation = async (conversationId, userId) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Kiểm tra role của user
    const roleCheck = await client.query(
      `SELECT role FROM conversation_members
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    if (roleCheck.rows.length === 0) {
      throw new Error("You are not a member of this conversation");
    }

    // Nếu là admin duy nhất → không cho rời
    if (roleCheck.rows[0].role === "admin") {
      const adminCount = await client.query(
        `SELECT COUNT(*) FROM conversation_members
         WHERE conversation_id = $1 AND role = 'admin'`,
        [conversationId]
      );
      if (parseInt(adminCount.rows[0].count) === 1) {
        throw new Error("Cannot leave: you are the only admin. Transfer admin role first.");
      }
    }

    await client.query(
      `DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Could not leave conversation: " + error.message);
    throw new Error(error.message);
  } finally {
    client.release();
  }
};


const delConversationHistory = async (conversationId, userId) => {
  const query = `
    UPDATE conversation_members 
    SET cleared_history_at = NOW() 
    WHERE conversation_id = $1 AND user_id = $2
  `;
  try {
    await db.query(query, [conversationId, userId]);
    return { success: true };
  } catch (error) {
    console.error("Could not delete conversation: " + error.message);
    throw new Error("Could not delete conversation: " + error.message);
  }
};

const removeGroupMember = async (conversationId, targetUserId) => {
  const query = `
    DELETE FROM conversation_members
    WHERE conversation_id = $1 AND user_id = $2
  `;
  try {
    await db.query(query, [conversationId, targetUserId]);
    return { success: true };
  } catch (error) {
    console.error("Could not remove group member: " + error.message);
    throw new Error("Could not remove group member: " + error.message);
  }
};

const renameGroup = async (conversationId, groupName) => {
  const query = `
    UPDATE conversations
    SET name = $1
    WHERE id = $2 AND type = 'group'
    RETURNING id, name
  `;
  try {
    const { rows } = await db.query(query, [groupName, conversationId]);
    return rows[0];
  } catch (error) {
    console.error("Could not rename group: " + error.message);
    throw new Error("Could not rename group: " + error.message);
  }
};

const transferAdmin = async (conversationId, newAdminId, currentAdminId) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Verify currentAdmin thực sự là admin
    const verify = await client.query(
      `SELECT role FROM conversation_members
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, currentAdminId]
    );
    if (!verify.rows[0] || verify.rows[0].role !== "admin") {
      throw new Error("You are not an admin of this group");
    }

    // Verify newAdmin là member của group
    const targetCheck = await client.query(
      `SELECT role FROM conversation_members
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, newAdminId]
    );
    if (!targetCheck.rows[0]) {
      throw new Error("Target user is not a member of this group");
    }

    // Downgrade current admin → member, upgrade new user → admin
    await client.query(
      `UPDATE conversation_members SET role = 'member'
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, currentAdminId]
    );
    await client.query(
      `UPDATE conversation_members SET role = 'admin'
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, newAdminId]
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Could not transfer admin: " + error.message);
    throw new Error(error.message);
  } finally {
    client.release();
  }
};

const deleteGroupConversation = async (conversationId) => {
  const query = `
    DELETE FROM conversations
    WHERE id = $1 AND type = 'group'
    RETURNING id
  `;
  try {
    const { rows } = await db.query(query, [conversationId]);
    if (rows.length === 0) {
      throw new Error("Group conversation not found or already deleted");
    }
    return { success: true, id: rows[0].id };
  } catch (error) {
    console.error("Could not delete group conversation: " + error.message);
    throw new Error("Could not delete group conversation: " + error.message);
  }
};

export default {
  getAllConversations,
  checkExistChat,
  newPrivateChat,
  newGroupChat,
  addNewMembers,
  searchConversation,
  getGroupMembers,
  leaveConversation,
  delConversationHistory,
  removeGroupMember,
  renameGroup,
  transferAdmin,
  deleteGroupConversation,
};
