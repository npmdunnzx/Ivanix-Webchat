import "../assets/styles/NewContactInfo.css";
import { useState } from "react";
import { motion } from "motion/react";
import { UserPlus, X, Check } from "lucide-react";
import user_avatar from "../assets/images/user_avatar.png";
import friendService from "../services/friend.service.js";
import { notifyError } from "../utils/toast.js";

const STATUS = {
  NONE: "none",
  SENT: "request_sent",
  RECEIVED: "request_received",
  ACCEPTED: "accepted", // trạng thái tạm, chỉ tồn tại phía client
};

function NewContactInfo(props) {
  const contactInfo = props.user;
  const [status, setStatus] = useState(contactInfo.rel_status ?? STATUS.NONE);
  const [loading, setLoading] = useState(false);
  // console.log("contactInfo", contactInfo);

  const targetId =
    status === STATUS.RECEIVED ? contactInfo.sender_id : contactInfo.receiver_id ?? contactInfo.id;

  const handleSendRequest = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await friendService.sendRequest(targetId);
      setStatus(STATUS.SENT);
      props.onAction && props.onAction();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || "Không thể gửi lời mời kết bạn");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await friendService.cancelRequest(targetId);
      setStatus(STATUS.NONE);
      props.onAction && props.onAction();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondRequest = async (action) => {
    if (loading) return;
    setLoading(true);
    try {
      await friendService.responseRequest(targetId, action);
      setStatus(action === "accepted" ? STATUS.ACCEPTED : STATUS.NONE);
      props.onAction && props.onAction();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderAction = () => {
    switch (status) {
      case STATUS.ACCEPTED:
        return (
          <button className="contacts-connect-btn sent" disabled>
            <Check size={12} />
            Bạn bè
          </button>
        );

      case STATUS.RECEIVED:
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              className="contacts-connect-btn"
              disabled={loading}
              onClick={() => handleRespondRequest("accepted")}
            >
              <Check size={12} />
              Chấp nhận
            </button>
            <button
              className="contacts-connect-btn"
              style={{ background: "#3A3B3C" }}
              disabled={loading}
              onClick={() => handleRespondRequest("rejected")}
            >
              <X size={12} />
              Từ chối
            </button>
          </div>
        );

      case STATUS.SENT:
        return (
          <button
            className="contacts-connect-btn sent"
            onClick={handleCancelRequest}
            disabled={loading}
          >
            <X size={12} />
            Hủy yêu cầu
          </button>
        );

      case STATUS.NONE:
      default:
        return (
          <button
            className="contacts-connect-btn"
            onClick={handleSendRequest}
            disabled={loading}
          >
            <UserPlus size={12} />
            Thêm bạn bè
          </button>
        );
    }
  };

  return (
    <motion.div
      key={contactInfo.id}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 m-2 contacts-db-card"
    >
      <div className="contacts-db-card-left">
        <div className="contacts-avatar-wrap">
          <img
            src={contactInfo.avatar_url || user_avatar}
            alt={contactInfo.username}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="contacts-db-info">
          <div className="contacts-db-name-row">
            <span className="contacts-db-username">{contactInfo.username}</span>
          </div>
          {renderAction()}
        </div>
      </div>
    </motion.div>
  );
}

export default NewContactInfo;