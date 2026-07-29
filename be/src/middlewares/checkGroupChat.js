import db from "../config/db.config.js";

const checkGroupAdmin = async (req, res, next) => {
  const conversationId =
    req.body?.conversation_id ||
    req.query?.conversationId ||
    req.query?.conversation_id ||
    req.params?.conversation_id;
  const userId = req.userId;
  const query = `
    SELECT role FROM conversation_members
    WHERE conversation_id = $1 AND user_id = $2`;

  try {
    const { rows } = await db.query(query, [conversationId, userId]);

    if (rows.length === 0)
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });

    if (rows[0].role !== "admin")
      return res
        .status(403)
        .json({ message: "Only admin can perform this action" });

    next();
  } catch (error) {
    console.error("Could not check group admin:" + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkConversationMember = async (req, res, next) => {
  const conversation_id =
    req.body?.conversation_id ||
    req.query?.conversationId ||
    req.query?.conversation_id ||
    req.params?.conversation_id;
  const userId = req.userId;
  try {
    const { rows } = await db.query(
      "SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2",
      [conversation_id, userId],
    );
    if (rows.length === 0) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }
    next();
  } catch (error) {
    console.error("Could not verify conversation membership:" + error.message);
    res
      .status(500)
      .json({
        message: "Could not verify conversation membership",
        error: error.message,
      });
  }
};

const GROUP_MEMBER_LIMIT = 50;

const checkGroupMemberLimit = async (req, res, next) => {
  const conversation_id =
    req.body?.conversation_id ||
    req.params?.conversation_id;

  const newMembersId = req.body?.membersId || [];
  const newCount = Array.isArray(newMembersId) ? newMembersId.length : 0;

  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS count FROM conversation_members WHERE conversation_id = $1`,
      [conversation_id]
    );
    const currentCount = parseInt(rows[0].count);

    if (currentCount + newCount > GROUP_MEMBER_LIMIT) {
      return res.status(400).json({
        message: `Group member limit exceeded. Current: ${currentCount}, Adding: ${newCount}, Max: ${GROUP_MEMBER_LIMIT}`,
      });
    }
    next();
  } catch (error) {
    console.error("Could not check group member limit: " + error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { checkGroupAdmin, checkConversationMember, checkGroupMemberLimit };

