import { query } from "express";
import db from "../config/db.config.js";
import config from "../config/env.config.js";
import utils from "../utils/utils.js";

const getMessages = async (conversationId, user_id ,befforeOffset = null, limit = 20) => {
    const query = `
    SELECT m.id, m.server_offset, m.content, m.message_type, m.file_url,
        m.file_name, m.sender_id, m.created_at, m.is_deleted,
        u.username AS sender_username,
        u.avatar_url AS sender_avt
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = $1
        AND ($2::bigint IS NULL OR m.server_offset < $2)
        AND m.is_deleted = FALSE
    ORDER BY m.server_offset ASC
    LIMIT $3`;

    const query2 = `
    UPDATE conversation_members
    SET unread_count = 0
    WHERE conversation_id = $1 AND user_id = $2`;
    const client = await db.getClient();

    try {
        await client.query("BEGIN");
        const {rows} = await db.query(query, [conversationId,befforeOffset, limit ]);
        
        const setUnreadCount = await client.query(query2, [conversationId, user_id]);
        
        await client.query("COMMIT");
        return rows;
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Could not get messages", error.message);
        throw new Error("Could not get messages", error.message);
    } finally {
        client.release();
    }
}

const newMessage = async (clientOffset= null, conversationId, senderId, content) => {
    const client = await db.getClient();
    const query1 = `
    INSERT INTO messages (client_offset, conversation_id, sender_id, content)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (client_offset) DO NOTHING
    RETURNING id, server_offset, sender_id, conversation_id, content, message_type, file_url, file_name, created_at`;

    try {
        // Insert 
        await client.query("BEGIN");
        const {rows} = await client.query(query1, [clientOffset, conversationId, senderId, content]);
        let message;

        if (rows.length === 0) {
            const query2 = `
            SELECT id, server_offset, content, sender_id, conversation_id, created_at
            FROM messages WHERE client_offset = $1`;
            // Nếu client_offset đã tồn tại (retry trùng) — không insert, lấy message cũ
            const existing = await client.query(query2, [clientOffset]);
            await client.query("COMMIT");
            return existing.rows[0];
        }
        message = rows[0];
        // Update conversation: last_message
        const query3 = `
        UPDATE conversations
        SET last_message_id = $1, 
            last_message_at = NOW(),
            last_message_sender_id = $2
        WHERE id = $3`;
        await client.query(query3, [message.id, senderId, conversationId]);

        // Tăng unread_count cho các member khác (không tăng cho sender)
        const query4 = `
        UPDATE conversation_members
        SET unread_count = unread_count + 1
        WHERE conversation_id = $1 AND user_id != $2`;
        await client.query(query4, [conversationId, senderId]);

        await client.query("COMMIT");
        return message;
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Could not create message: " + error.message);        
        throw new Error("Could not create message: " + error.message);
    } finally {
        client.release();
    }
};

export default {getMessages, newMessage};