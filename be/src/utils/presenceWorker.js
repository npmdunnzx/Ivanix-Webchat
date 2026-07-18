import redis from "../config/redis.config.js";
import db from "../config/db.config.js";

const PRESENCE_KEYS = {
  connections: (userId) => `user:connections:${userId}`,
  presence: (userId) => `user:presence:${userId}`,
  onlineUsers: "presence:online_users",
};

const startPresenceWorker = (io) => {
  // Chạy mỗi 30 giây
  setInterval(async () => {
    try {
      const now = Date.now();
      const threshold = now - 45000; // 45 giây trước

      // Lấy danh sách user quá hạn heartbeat
      const zombieUserIds = await redis.zrangebyscore(PRESENCE_KEYS.onlineUsers, "-inf", threshold);

      if (zombieUserIds.length > 0) {
        console.log(`PresenceWorker: Phát hiện và xử lý ${zombieUserIds.length} kết nối zombie.`);
        
      const pipeline = redis.pipeline();
      for (const userId of zombieUserIds) {
        pipeline
          .del(PRESENCE_KEYS.connections(userId))
          .zrem(PRESENCE_KEYS.onlineUsers, userId)
          .hset(PRESENCE_KEYS.presence(userId), "status", "offline", "last_active", now);
      }
      await pipeline.exec();
      // Đồng bộ last_seen xuống Postgres cho toàn bộ zombie user trong 1 câu lệnh
      await db.query(
        `UPDATE users SET last_seen = NOW() WHERE id = ANY($1::uuid[])`,
        [zombieUserIds],
      );

      const onlineUserIds = await redis.zrange(PRESENCE_KEYS.onlineUsers, 0, -1);
      io.emit("getOnlineUsers", onlineUserIds);

      }
    } catch (err) {
      console.error("[PresenceWorker] error:", err);
    }
  }, 30000);
};

export default startPresenceWorker;
