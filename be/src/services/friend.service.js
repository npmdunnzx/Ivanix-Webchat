import db from "../config/db.config.js";

const sendRequest = async (senderId, receiverId) => {
  if (senderId === receiverId) {
    throw new Error("Could not add yourself as a friend");
  }

  const user1 = senderId < receiverId ? senderId : receiverId;
  const user2 = senderId < receiverId ? receiverId : senderId;

  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    const friendshipCheck = await client.query(
      `SELECT 1 FROM friendships WHERE user_id1 = $1 AND user_id2 = $2`,
      [user1, user2],
    );
    if (friendshipCheck.rows.length > 0) {
      throw new Error("You are already friends with this user");
    }

    // Chặn nếu chiều ngược lại đã tồn tại pending request
    const reverseCheck = await client.query(
      `SELECT id FROM friend_requests
       WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [receiverId, senderId],
    );
    if (reverseCheck.rows.length > 0) {
      throw new Error("This user has already sent you a friend request");
    }

    const { rows } = await client.query(
      `INSERT INTO friend_requests (sender_id, receiver_id)
       VALUES ($1, $2)
       ON CONFLICT (sender_id, receiver_id) DO NOTHING
       RETURNING id, sender_id, receiver_id, status`,
      [senderId, receiverId],
    );

    if (!rows[0]) {
      throw new Error("Friend request already sent");
    }

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    // Bắt unique violation từ idx_unique_pending_pair (race condition)
    if (error.code === "23505") {
      throw new Error("A friend request already exists between these users");
    }
    throw error;
  } finally {
    client.release();
  }
};


const cancelRequest = async (senderId, receiverId) => {
  const query = `
    DELETE FROM friend_requests
    WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
    RETURNING id`;
  try {
    const { rows } = await db.query(query, [senderId, receiverId]);
    if (rows.length === 0) {
      throw new Error("No pending friend request found to cancel");
    }
    return rows[0];
  } catch (error) {
    throw new Error(
      `Database error while canceling friend request: ${error.message}`,
    );
  }
};

const responseRequest = async (status, senderId, receiverId) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const query1 = `
      DELETE FROM friend_requests
      WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
      RETURNING id`;

    const { rows } = await client.query(query1, [senderId, receiverId]);
    if (rows.length === 0) {
      throw new Error("No pending friend request found for this user");
    }
    if (status === "accepted") {
      const query2 = `
        INSERT INTO friendships (user_id1, user_id2)
        VALUES ($1, $2)
        ON CONFLICT (user_id1, user_id2) DO NOTHING`;
      const user1 = senderId < receiverId ? senderId : receiverId;
      const user2 = senderId < receiverId ? receiverId : senderId;
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
        u.username AS username, u.avatar_url AS avatar_url,
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

const getMyRequests = async (userId) => {
  const query = `
    SELECT fr.id, fr.receiver_id,
        u.username AS username, u.avatar_url AS avatar_url,
        fr.status, fr.created_at
    FROM friend_requests fr
    JOIN users u ON fr.receiver_id = u.id
    WHERE fr.sender_id = $1
    ORDER BY fr.created_at DESC`;
  try {
    const { rows } = await db.query(query, [userId]);
    return rows;
  } catch (error) {
    throw new Error(
      "Error occurred while fetching my friend requests" + error.message,
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

export default { sendRequest, responseRequest, cancelRequest, getPendingRequests, getMyRequests, getFriends  };
