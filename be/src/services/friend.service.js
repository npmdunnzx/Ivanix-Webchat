import db from "../config/db.config.js";

const sendRequest = async (senderId, receiverId) => {
  if (senderId === receiverId) {
    throw new Error("Could not add yourself as a friend");
  }

  const user1 = senderId < receiverId ? senderId : receiverId;
  const user2 = senderId < receiverId ? receiverId : senderId;
  const query1 = `
    SELECT 1 FROM friendships
    WHERE (user_id1 = $1 AND user_id2 = $2)
    `;

  const query2 = `
    INSERT INTO friend_requests( sender_id, receiver_id)
    VALUES ($1, $2)
    ON CONFLICT (sender_id, receiver_id) DO NOTHING
    RETURNING id, sender_id, receiver_id, status`;

  const friendshipCheck = await db.query(query1, [user1, user2]);
  if (friendshipCheck.rows.length > 0) {
    throw new Error("You are already friends with this user");
  }

  try {
    const { rows } = await db.query(query2, [senderId, receiverId]);
    if (!rows[0]) {
      throw new Error("Friend request already sent");
    }
    return rows[0];
  } catch (error) {
    throw new Error(
      `Database error while sending friend request: ${error.message}`,
    );
  }
};

const responseRequest = async (status, requestId, receiverId) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const query1 = `
            UPDATE friend_requests
            SET status = $1, updated_at = NOW()
            WHERE sender_id = $2 AND receiver_id = $3 AND status = 'pending'
            RETURNING id`;

    const { rows } = await client.query(query1, [
      status,
      requestId,
      receiverId,
    ]);
    if (rows.length === 0) {
      throw new Error("No pending friend request found for this user");
    }
    if (status === "accepted") {
      const query2 = `
            INSERT INTO friendships (user_id1, user_id2)
            VALUES ($1, $2)
            ON CONFLICT (user_id1, user_id2) DO NOTHING`;
      const user1 = requestId < receiverId ? requestId : receiverId;
      const user2 = requestId < receiverId ? receiverId : requestId;
      await client.query(query2, [user1, user2]);
    }
    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(
      "Error occurred while responding to friend request" + error.message,
    );
  } finally {
    client.release();
  }
};

const getPendingRequests = async (userId) => {
  const query = `
    SELECT fr.id, fr.sender_id, 
        u.username AS sender_username, u.avatar_url AS sender_avatar,
        fr.created_at
    FROM friend_requests fr
    JOIN users u ON fr.sender_id = u.id
    WHERE fr.receiver_id = $1 AND fr.status = 'pending'
    ORDER BY fr.created_at DESC`;
  try {
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    throw new Error(
      "Error occurred while fetching pending friend requests" + error.message,
    );
  }
};

const getFriends = async (userId) => {
  const query = `
    SELECT u.id, u.username, u.avatar_url
    FROM users u
    JOIN (
        SELECT user_id2 AS friend_id FROM friendships WHERE user_id1 = $1
        UNION ALL
        SELECT user_id1 AS friend_id FROM friendships WHERE user_id2 = $1
    ) f ON u.id = f.friend_id;
    `;
  try {
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    throw new Error("Error occurred while fetching friends" + error.message);
  }
};

export default { sendRequest, responseRequest, getPendingRequests, getFriends };
