import db from "../config/db.config.js";
import cloudinary from "../config/cloudinary.config.js";
import uploadService from "./upload.service.js";

const getMessages = async (
  conversationId,
  user_id,
  beforeOffset = null,
  limit = 20,
) => {
  const query = `
    SELECT
      m.id, m.server_offset, m.content, m.message_type, 
      m.sender_id, m.created_at, m.is_deleted,
      u.username AS sender_username, u.avatar_url AS sender_avt,

      COALESCE(
        json_agg(
          json_build_object(
            'id', ma.id,
            'file_url', ma.file_url,
            'file_public_id', ma.file_public_id,
            'file_name', ma.file_name,
            'mime_type', ma.mime_type,
            'file_size', ma.file_size,
            'display_order', ma.display_order
          )
          ORDER BY ma.display_order
        ) FILTER (WHERE ma.id IS NOT NULL),
        '[]'::json
      ) AS attachments  
    FROM messages m
    JOIN users u
        ON u.id = m.sender_id
    LEFT JOIN message_attachments ma
        ON ma.message_id = m.id
    JOIN conversation_members cm
        ON cm.conversation_id = m.conversation_id
      AND cm.user_id = $2
    WHERE
        m.conversation_id = $1
        AND ($3::bigint IS NULL OR m.server_offset < $3)
        AND m.is_deleted = FALSE
        AND (
            cm.cleared_history_at IS NULL
            OR m.created_at > cm.cleared_history_at
        )
    GROUP BY m.id, u.username, u.avatar_url
    ORDER BY m.server_offset DESC
    LIMIT $4;`;
  const query2 = `
    UPDATE conversation_members
    SET unread_count = 0
    WHERE conversation_id = $1 AND user_id = $2`;
  const client = await db.getClient();

  try {
    await client.query("BEGIN");
    const { rows } = await client.query(query, [
      conversationId,
      user_id,
      beforeOffset,
      limit,
    ]);

    await client.query(query2, [conversationId, user_id]);

    await client.query("COMMIT");
    return rows;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Could not get messages" + error.message);
    throw new Error("Could not get messages" + error.message);
  } finally {
    client.release();
  }
};

const newMessage = async (
  clientOffset = null,
  conversationId,
  senderId,
  content,
) => {
  const client = await db.getClient();
  const query1 = `
    INSERT INTO messages (client_offset, conversation_id, sender_id, content)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (client_offset) DO NOTHING
    RETURNING id, server_offset, client_offset, sender_id, conversation_id, content, message_type, created_at`;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(query1, [
      clientOffset,
      conversationId,
      senderId,
      content,
    ]);
    let message;
    if (rows.length === 0) {
      const query2 = `
        SELECT m.id, m.server_offset, m.client_offset, m.content, m.sender_id, m.conversation_id, m.created_at,
               u.username AS sender_username, u.avatar_url AS sender_avt
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.client_offset = $1`;
      const existing = await client.query(query2, [clientOffset]);
      await client.query("COMMIT");
      return existing.rows[0];
    }
    message = rows[0];
    const query3 = `
        UPDATE conversations
        SET last_message_id = $1, 
            last_message_at = NOW(),
            last_message_sender_id = $2
        WHERE id = $3`;
    await client.query(query3, [message.id, senderId, conversationId]);
    const query4 = `
        UPDATE conversation_members
        SET unread_count = unread_count + 1
        WHERE conversation_id = $1 AND user_id != $2`;
    await client.query(query4, [conversationId, senderId]);
    // Lấy sender_username và sender_avt để trả về cùng message
    const queryUser = `SELECT username AS sender_username, avatar_url AS sender_avt FROM users WHERE id = $1`;
    const { rows: userRows } = await client.query(queryUser, [senderId]);
    await client.query("COMMIT");
    return { ...message, ...userRows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Could not create message: " + error.message);
    throw new Error("Could not create message: " + error.message);
  } finally {
    client.release();
  }
};
const uploadFilesMessage = async (
  clientOffset = null,
  conversationId,
  senderId,
  files = [],
) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }
  const uploadedFiles = await uploadService.uploadFiles(
    files,
    `chat/${conversationId}`,
  );
  const client = await db.getClient();
  const query1 = `
    INSERT INTO messages (client_offset, conversation_id, sender_id, message_type)
    VALUES ($1, $2, $3, 'file')
    ON CONFLICT (client_offset) DO NOTHING
    RETURNING id, server_offset, client_offset, sender_id, conversation_id, message_type, created_at`;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(query1, [
      clientOffset,
      conversationId,
      senderId,
    ]);
    let message;
    if (rows.length === 0) {
      const query2 = `
        SELECT
          m.id, m.server_offset, m.client_offset, m.message_type,
          m.sender_id, m.conversation_id, m.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ma.id,
                'file_url', ma.file_url,
                'file_public_id', ma.file_public_id,
                'file_name', ma.file_name,
                'mime_type', ma.mime_type,
                'file_size', ma.file_size,
                'display_order', ma.display_order
              ) ORDER BY ma.display_order
            ) FILTER (WHERE ma.id IS NOT NULL),
            '[]'::json
          ) AS attachments
        FROM messages m
        LEFT JOIN message_attachments ma ON ma.message_id = m.id
        WHERE m.client_offset = $1
        GROUP BY m.id`;
      const existing = await client.query(query2, [clientOffset]);
      await client.query("COMMIT");
      return existing.rows[0];
    }
    message = rows[0];
    // Batch insert attachments
    const values = [];
    const valueClauses = [];
    uploadedFiles.forEach((att, idx) => {
      const offset = idx * 7;
      valueClauses.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
      );
      values.push(
        message.id,
        att.file_url,
        att.file_public_id,
        att.file_name,
        att.mime_type,
        att.file_size,
        att.display_order,
      );
    });
    const query3 = `
      INSERT INTO message_attachments
        (message_id, file_url, file_public_id, file_name, mime_type, file_size, display_order)
      VALUES ${valueClauses.join(", ")}
      RETURNING id, file_url, file_public_id, file_name, mime_type, file_size, display_order`;
    const { rows: attachments } = await client.query(query3, values);
    const query4 = `
      UPDATE conversations
      SET last_message_id = $1,
          last_message_at = NOW(),
          last_message_sender_id = $2
      WHERE id = $3`;
    await client.query(query4, [message.id, senderId, conversationId]);
    const query5 = `
      UPDATE conversation_members
      SET unread_count = unread_count + 1
      WHERE conversation_id = $1 AND user_id != $2`;
    await client.query(query5, [conversationId, senderId]);
    await client.query("COMMIT");
    return { ...message, attachments };
  } catch (error) {
    await client.query("ROLLBACK");
    await Promise.all(
      uploadedFiles.map((f) =>
        cloudinary.uploader.destroy(f.file_public_id).catch(() => {}),
      ),
    );
    console.error(
      "Could not create message with attachments: " + error.message,
    );
    throw new Error(
      "Could not create message with attachments: " + error.message,
    );
  } finally {
    client.release();
  }
};
export default { getMessages, newMessage, uploadFilesMessage };