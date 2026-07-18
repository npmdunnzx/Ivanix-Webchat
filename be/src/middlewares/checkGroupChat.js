import db from "../config/db.config.js";

const checkGroupAdmin = async (req, res, next) => {
  const conversationId = req.body.conversation_id;
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
  const conversation_id = req.query.conversationId || req.params.conversation_id;
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

export { checkGroupAdmin, checkConversationMember };
