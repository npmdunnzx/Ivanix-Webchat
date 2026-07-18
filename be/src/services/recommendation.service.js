import db from "../config/db.config.js";
import redis from "../config/redis.config.js";

const WEIGHT_MUTUAL_FRIEND = 15;
const WEIGHT_MUTUAL_GROUP = 10;
const WEIGHT_INTERACTION = 5;
const ONLINE_BOOST = 3; // Boost nhỏ, không áp đảo staticScore (khác bug +30 ở bản trước).
const RECENT_INTERACTION_DAYS = 30;
const MAX_CANDIDATES_PER_USER = 100; // Pool trước khi rank động, không phải kết quả cuối.
const CACHE_TTL_SECONDS = 86400;

const featureKey = (userId) => `user:recommendation_features:${userId}`;

// score "tĩnh" dùng để cắt Top 100 lúc lưu cache, và cũng dùng lại lúc rank động
// (chỉ cộng thêm online boost lúc query, không tính lại từ đầu).
const staticScore = ({ mf, mgw, ri }) =>
  WEIGHT_MUTUAL_FRIEND * Math.log(1 + mf) +
  WEIGHT_MUTUAL_GROUP * mgw +
  WEIGHT_INTERACTION * Math.log(1 + ri);

/**
 * Candidate Generation + Feature Extraction, chạy định kỳ (cron).
 * Chỉ tính cho các cặp THỰC SỰ có liên quan (chung bạn / chung nhóm / từng chat riêng) —
 * không duyệt N² toàn bộ user.
 * Lưu FEATURE thô (mf, mgw, ri) vào Redis Hash, KHÔNG lưu sẵn score cuối —
 * để tầng API có thể đổi công thức xếp hạng bất kỳ lúc nào mà không cần chạy lại cron.
 */
const computeStaticFeatures = async () => {
  console.log("Starting recommendation feature computation...");
  try {
    // Nguồn 1: mutual friends — log() để 1 user có rất nhiều bạn không áp đảo bảng xếp hạng.
    const mutualFriendsQuery = `
      WITH friend_edges AS (
        SELECT user_id1 AS user_id, user_id2 AS friend_id FROM friendships
        UNION ALL
        SELECT user_id2 AS user_id, user_id1 AS friend_id FROM friendships
      )
      SELECT e1.user_id, e2.user_id AS target_id, COUNT(*) AS mutual_friends
      FROM friend_edges e1
      JOIN friend_edges e2 ON e1.friend_id = e2.friend_id AND e1.user_id <> e2.user_id
      GROUP BY e1.user_id, e2.user_id
    `;

    // Nguồn 2: mutual groups — mỗi nhóm chung đóng góp theo 1/log(size), nhóm nhỏ "thân" hơn nhóm lớn.
    const mutualGroupsQuery = `
      WITH group_sizes AS (
        SELECT cm.conversation_id, COUNT(*) AS member_count
        FROM conversation_members cm
        JOIN conversations c ON c.id = cm.conversation_id AND c.type = 'group'
        GROUP BY cm.conversation_id
      )
      SELECT cm1.user_id, cm2.user_id AS target_id,
             COUNT(*) AS mutual_groups,
             SUM(1.0 / LN(2 + gs.member_count)) AS mutual_groups_weighted
      FROM conversation_members cm1
      JOIN conversation_members cm2
        ON cm2.conversation_id = cm1.conversation_id AND cm2.user_id <> cm1.user_id
      JOIN group_sizes gs ON gs.conversation_id = cm1.conversation_id
      GROUP BY cm1.user_id, cm2.user_id
    `;

    // Nguồn 3: từng nhắn tin riêng gần đây — chỉ tính trong các private conversation có tin nhắn
    // trong N ngày gần nhất, phạm vi tự nhiên đã bị giới hạn (không phải toàn bộ user).
    const interactionQuery = `
      WITH private_pairs AS (
        SELECT cm1.user_id AS user_id, cm2.user_id AS target_id, cm1.conversation_id
        FROM conversation_members cm1
        JOIN conversation_members cm2
          ON cm2.conversation_id = cm1.conversation_id AND cm2.user_id <> cm1.user_id
        JOIN conversations c ON c.id = cm1.conversation_id AND c.type = 'private'
      )
      SELECT pp.user_id, pp.target_id, COUNT(m.id) AS recent_interactions
      FROM private_pairs pp
      JOIN messages m
        ON m.conversation_id = pp.conversation_id
        AND m.created_at > NOW() - INTERVAL '${RECENT_INTERACTION_DAYS} days'
        AND m.is_deleted = FALSE
      GROUP BY pp.user_id, pp.target_id
    `;

    const excludeFriendsQuery = `SELECT user_id1 AS a, user_id2 AS b FROM friendships`;
    const excludePendingQuery = `
      SELECT sender_id AS a, receiver_id AS b FROM friend_requests WHERE status = 'pending'
    `;

    const [friendsRes, groupsRes, interactionRes, friendshipRes, pendingRes] = await Promise.all([
      db.query(mutualFriendsQuery),
      db.query(mutualGroupsQuery),
      db.query(interactionQuery),
      db.query(excludeFriendsQuery),
      db.query(excludePendingQuery),
    ]);

    const excludeSet = new Set();
    for (const { a, b } of [...friendshipRes.rows, ...pendingRes.rows]) {
      excludeSet.add(`${a}:${b}`);
      excludeSet.add(`${b}:${a}`);
    }

    // userId -> Map(targetId -> { mf, mgw, ri })
    const featureMap = new Map();
    const getEntry = (userId, targetId) => {
      if (userId === targetId) return null;
      if (excludeSet.has(`${userId}:${targetId}`)) return null;

      if (!featureMap.has(userId)) featureMap.set(userId, new Map());
      const inner = featureMap.get(userId);
      if (!inner.has(targetId)) inner.set(targetId, { mf: 0, mgw: 0, ri: 0 });
      return inner.get(targetId);
    };

    for (const row of friendsRes.rows) {
      const entry = getEntry(row.user_id, row.target_id);
      if (entry) entry.mf = Number(row.mutual_friends);
    }
    for (const row of groupsRes.rows) {
      const entry = getEntry(row.user_id, row.target_id);
      if (entry) entry.mgw = Number(row.mutual_groups_weighted);
    }
    for (const row of interactionRes.rows) {
      const entry = getEntry(row.user_id, row.target_id);
      if (entry) entry.ri = Number(row.recent_interactions);
    }

    // Cắt Top N theo static score trước khi ghi vào Redis, tránh Hash phình to
    // với user có rất nhiều candidate (ví dụ ở trong nhiều nhóm lớn).
    const pipeline = redis.pipeline();
    for (const [userId, targets] of featureMap.entries()) {
      const key = featureKey(userId);
      pipeline.del(key);

      const ranked = [...targets.entries()]
        .map(([targetId, f]) => ({ targetId, f, score: staticScore(f) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_CANDIDATES_PER_USER);

      if (ranked.length === 0) continue;

      const hashArgs = [];
      for (const { targetId, f } of ranked) {
        hashArgs.push(targetId, JSON.stringify(f));
      }
      pipeline.hset(key, ...hashArgs);
      pipeline.expire(key, CACHE_TTL_SECONDS);
    }
    await pipeline.exec();

    console.log(`Recommendation features computed for ${featureMap.size} users.`);
  } catch (err) {
    console.error("Error computing recommendation features:", err);
  }
};

/**
 * Rank động lúc request: đọc feature từ cache, cộng thêm online boost (nhỏ, không áp đảo),
 * sort lại, trả Top 10. Đổi trọng số/công thức ở đây không cần chạy lại cron.
 */
const getRecommendations = async (userId) => {
  console.log(`Fetching recommendations for user ${userId}...`);
  const key = featureKey(userId);
  const raw = await redis.hgetall(key); // { targetId: '{"mf":..,"mgw":..,"ri":..}', ... }
  const candidateIds = Object.keys(raw);

  if (candidateIds.length === 0) {
    // Cache trống (user mới / chưa tới chu kỳ cron) -> fallback: user mới nhất,
    // vẫn loại trừ bạn bè hiện có và lời mời đang pending.
    const query = `
      SELECT id, username, avatar_url
      FROM users
      WHERE id <> $1
        AND id NOT IN (
          SELECT user_id2 FROM friendships WHERE user_id1 = $1
          UNION SELECT user_id1 FROM friendships WHERE user_id2 = $1
        )
        AND id NOT IN (
          SELECT receiver_id FROM friend_requests WHERE sender_id = $1 AND status = 'pending'
          UNION
          SELECT sender_id FROM friend_requests WHERE receiver_id = $1 AND status = 'pending'
        )
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }

  // Batch check presence bằng 1 pipeline thay vì N lần hget riêng lẻ.
  const presencePipeline = redis.pipeline();
  candidateIds.forEach((id) => presencePipeline.hget(`user:presence:${id}`, "status"));
  const presenceResults = await presencePipeline.exec(); // [[err, value], ...]

  // Batch lấy profile bằng 1 câu SQL duy nhất.
  const profileRes = await db.query(
    `SELECT id, username, avatar_url FROM users WHERE id = ANY($1::uuid[])`,
    [candidateIds],
  );
  const profileMap = new Map(profileRes.rows.map((u) => [u.id, u]));

  const ranked = candidateIds.map((id, idx) => {
    const feature = JSON.parse(raw[id]);
    const isOnline = presenceResults[idx]?.[1] === "online";
    const profile = profileMap.get(id) || {};

    return {
      id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      is_online: isOnline,
      score: staticScore(feature) + (isOnline ? ONLINE_BOOST : 0),
    };
  });

  return ranked.sort((a, b) => b.score - a.score).slice(0, 10);
};

export default { computeStaticFeatures, getRecommendations };