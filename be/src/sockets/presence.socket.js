import redis from "../config/redis.config.js";
import db from "../config/db.config.js";

// Tập trung Redis key ở 1 chỗ, tránh hard-code/typo rải rác.
const PRESENCE_KEYS = {
  connections: (userId) => `user:connections:${userId}`, // Set: Lưu tất cả socketId đang mở của user (multi-tab)
  presence: (userId) => `user:presence:${userId}`, // Hash: { status, last_active }
  onlineUsers: "presence:online_users", // Sorted Set: userId -> timestamp hoạt động gần nhất
};

// Gắn listener presence cho 1 socket vừa connect. Gọi trong io.on("connection", ...).
const registerPresenceHandlers = (io, socket) => {
  const userId = String(socket.userId);
  const socketId = socket.id;

  // Đánh dấu socket online, rồi broadcast full danh sách online cho mọi client
  // (kể cả client vừa connect cũng nhận đủ state, không cần snapshot riêng).
  const handleConnect = async () => {
    try {
      const now = Date.now();
      // Pipeline: gom nhiều lệnh Redis thành 1 round-trip.
      await redis
        .pipeline()
        .sadd(PRESENCE_KEYS.connections(userId), socketId)
        .hset(
          PRESENCE_KEYS.presence(userId),
          "status",
          "online",
          "last_active",
          now,
        )
        .zadd(PRESENCE_KEYS.onlineUsers, now, userId)
        .exec();

      const onlineUserIds = await getOnlineUserIds();
      io.emit("getOnlineUsers", onlineUserIds);

      console.log(`[Presence] User ${userId} connected (socket ${socketId})`);
    } catch (err) {
      console.error("[Presence] Connect error:", err);
    }
  };

  handleConnect();

  // Client gọi định kỳ (vd 25s/lần) để xác nhận còn hoạt động.
  // Chỉ cập nhật timestamp, không broadcast lại (trạng thái online không đổi).
  socket.on("heartbeat", async () => {
    try {
      const now = Date.now();

      await redis
        .pipeline()
        .hset(PRESENCE_KEYS.presence(userId), "last_active", now)
        .zadd(PRESENCE_KEYS.onlineUsers, now, userId)
        .exec();
    } catch (err) {
      console.error("[Presence] Heartbeat error:", err);
    }
  });

  // Gỡ socket khỏi connections; nếu user còn tab khác thì vẫn online.
  // Hết tab -> đánh dấu offline, đồng bộ last_seen xuống Postgres, broadcast lại.
  socket.on("disconnect", async () => {
    try {
      const now = Date.now();
      // srem : xóa socketId khỏi set connections của user, 
      // nếu còn socketId khác thì user vẫn online, chỉ khi hết socketId mới offline.
      await redis.srem(PRESENCE_KEYS.connections(userId), socketId);
      
      //scard : đếm số lượng socketId còn lại của user trong set connections,
      // nếu còn > 0 thì user vẫn online, không cần đánh dấu offline.
      const activeConnections = await redis.scard(
        PRESENCE_KEYS.connections(userId),
      );

      if (activeConnections > 0) return;
      // del : xóa set connections của user,
      // zrem : xóa userId khỏi sorted set onlineUsers, 
      // hset : cập nhật status offline và last_active
      await redis
        .pipeline()
        .del(PRESENCE_KEYS.connections(userId))
        .zrem(PRESENCE_KEYS.onlineUsers, userId)
        .hset(
          PRESENCE_KEYS.presence(userId),
          "status",
          "offline",
          "last_active",
          now,
        )
        .exec();

      // Redis chỉ là cache; Postgres giữ last_seen bền vững.
      await db.query(
        `UPDATE users SET last_seen = NOW() WHERE id = $1`,
        [userId],
      );

      const onlineUserIds = await getOnlineUserIds();
      io.emit("getOnlineUsers", onlineUserIds);

      console.log(`[Presence] User ${userId} disconnected (fully offline)`);
    } catch (err) {
      console.error("[Presence] Disconnect error:", err);
    }
  });
};

// Toàn bộ socketId đang mở của 1 user (emit riêng cho mọi tab của họ).
const getUserSockets = async (userId) => {
  return await redis.smembers(PRESENCE_KEYS.connections(String(userId)));
};

// Toàn bộ userId đang online (dùng để broadcast hoặc FE fetch lần đầu).
const getOnlineUserIds = async () => {
  return await redis.zrange(PRESENCE_KEYS.onlineUsers, 0, -1);
};

// Check nhanh 1 user có đang online không (vd chấm xanh trong search/profile).
const isUserOnline = async (userId) => {
  const status = await redis.hget(
    PRESENCE_KEYS.presence(String(userId)),
    "status",
  );
  return status === "online";
};

// Ghi chú: io.emit() chỉ tới client cùng 1 instance Neode — scale ngang cần
// @socket.io/redis-adapter. Chưa có job dọn "online ảo" khi servr crash
// (có thể dùng ZRANGEBYSCORE để tìm user quá hạn heartbeat).

export {
  registerPresenceHandlers,
  getUserSockets,
  getOnlineUserIds,
  isUserOnline,
};