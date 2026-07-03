import { useState } from "react";
import {
  Users,
  Search as SearchIcon,
  MessageSquare,
  Trash2,
  Sparkles,
  UserPlus,
  X,
  Check,
  AtSign,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "../assets/styles/contacts.css";
import user_avatar from "../assets/images/user_avatar.png";

const DB_USERS = [
  {
    id: "b75fba18-bc19-4b6e-8ee9-23c31e9c2f61",
    username: "baotram_pm",
    
    avatar_url:
      user_avatar,
    last_seen: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "f8df90ca-a6c3-42e7-8b01-57ebcde0ff99",
    username: "tuankiet_devops",
    
    avatar_url:
      user_avatar,
    last_seen: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "d9da8efb-11c2-4911-aa94-e8b9fb641a23",
    username: "dieulinh_seo",
    
    avatar_url:
      user_avatar,
    last_seen: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "ccbe81da-4bc5-4422-9213-94cacc56daaa",
    username: "hoanglam_lead",
    
    avatar_url:
      user_avatar,
    last_seen: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: "e399caab-5211-4770-bdff-cde22888bf1b",
    username: "phuongthao_qa",
    
    avatar_url:
      user_avatar,
    last_seen: new Date(Date.now() - 25 * 60000).toISOString(),
  },
];

const INITIAL_FRIENDS = [
  {
    id: "f87a8cb4-22b1-4f11-9a77-49520ea1901a",
    username: "lehung_lead",
    
    avatar_url:
      user_avatar,
    last_seen: "online",
  },
  {
    id: "b55adecf-168a-4bb0-aa22-55cd4fe5da84",
    username: "minhtu_designer",
    
    avatar_url:
      user_avatar,
    last_seen: "online",
  },
  {
    id: "e49da59d-ea2a-4dfa-bbf1-ae020224bf11",
    username: "khanhan_mkt",
    
    avatar_url:
      user_avatar,
    last_seen: "online",
  },
  {
    id: "a9fe8a14-419b-43dd-b88e-cf02bf41b8a9",
    username: "quangthang_back",
    
    avatar_url:
      user_avatar,
    last_seen: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "8ca8de4d-0ef1-4b16-bc9b-3df76af9cda4",
    username: "hoangminh_pm",
    
    avatar_url:
      user_avatar,
    last_seen: "online",
  },
];

function getStatus(lastSeen) {
  if (lastSeen === "online") return { text: "Trực tuyến", isOnline: true };
  try {
    const diffMins = Math.floor(
      (Date.now() - new Date(lastSeen).getTime()) / 60000,
    );
    if (diffMins < 5) return { text: "Vừa mới hoạt động", isOnline: true };
    if (diffMins < 60)
      return { text: `Hoạt động ${diffMins} phút trước`, isOnline: false };
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return { text: `Hoạt động ${diffHours} giờ trước`, isOnline: false };
    return { text: "Ngoại tuyến", isOnline: false };
  } catch {
    return { text: "Ngoại tuyến", isOnline: false };
  }
}

export default function Contacts() {
  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [dbUsers, setDbUsers] = useState(DB_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [slideOpen, setSlideOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  };

  const handleAdd = (user) => {
    if (friends.some((f) => f.id === user.id)) {
      showToast("Đồng nghiệp này đã có trong danh bạ!", "info");
      return;
    }
    setFriends((prev) => [user, ...prev]);
    setDbUsers((prev) => prev.filter((u) => u.id !== user.id));
    showToast(`Đã kết nối với @${user.username} thành công! 🎉`);
  };

  const handleDelete = (id, username) => {
    const removed = friends.find((f) => f.id === id);
    setFriends((prev) => prev.filter((f) => f.id !== id));
    if (removed) setDbUsers((prev) => [removed, ...prev]);
    showToast(`Đã gỡ kết nối với @${username}`, "info");
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const foundDbUsers =
    addQuery.trim() === ""
      ? dbUsers
      : dbUsers.filter(
          (u) =>
            u.username.toLowerCase().includes(addQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(addQuery.toLowerCase()),
        );

  return (
    <div className="contacts-page">
      {/* Toast layer */}
      <div className="contacts-toast-layer">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.92 }}
              className={`contacts-toast ${toast.type}`}
            >
              <Check size={16} />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="contacts-inner">
        {/* Header */}
        <div className="contacts-header">
          <div className="contacts-header-left">
            <h1>
              <Users size={26} />
              Danh bạ
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSlideOpen((v) => !v)}
            className={`contacts-add-btn ${slideOpen ? "open" : "closed"}`}
          >
            {slideOpen ? <X size={14} /> : <UserPlus size={14} />}
            {slideOpen ? "Đóng bảng tìm kiếm" : "Thêm bạn mới"}
            {slideOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </motion.button>
        </div>

        {/* Slide panel */}
        <AnimatePresence>
          {slideOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
              className="contacts-slide-panel"
            >
              <div className="contacts-slide-panel-inner">
                <div className="contacts-slide-top">
                  <div>
                    <h3>
                      <Sparkles size={14} /> Tìm kiếm theo Username
                    </h3>
                  </div>
                  <div className="contacts-search-input-wrap">
                    <AtSign size={14} />
                    <input
                      placeholder="Nhập tên tài khoản, ví dụ: baotram..."
                      value={addQuery}
                      onChange={(e) => setAddQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="contacts-db-section">
                  <p className="contacts-db-label">
                    Danh sách người dùng ({foundDbUsers.length})
                  </p>

                  {foundDbUsers.length === 0 ? (
                    <div className="contacts-db-empty">
                      Không có người dùng nào khớp với truy vấn của bạn.
                    </div>
                  ) : (
                    <div className="contacts-db-grid">
                      {foundDbUsers.map((user) => {
                        const status = getStatus(user.last_seen);
                        return (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="contacts-db-card"
                          >
                            <div className="contacts-db-card-left">
                              <div className="contacts-avatar-wrap">
                                <img
                                  src={user.avatar_url}
                                  alt={user.username}
                                  referrerPolicy="no-referrer"
                                />
                                <span
                                  className={`contacts-status-dot ${status.isOnline ? "online" : "offline"}`}
                                />
                              </div>
                              <div className="contacts-db-info">
                                <div className="contacts-db-name-row">
                                  <span className="contacts-db-username">
                                    @{user.username}
                                  </span>
                                </div>
                                <p className="contacts-db-email">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <button
                              className="contacts-connect-btn"
                              onClick={() => handleAdd(user)}
                            >
                              <UserPlus size={12} />
                              Kết nối
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter bar */}
        <div className="contacts-filter-bar">
          <div className="contacts-filter-input-wrap">
            <SearchIcon size={15} />
            <input
              placeholder="Lọc danh bạ theo Username hoặc Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="contacts-count">
            <Clock size={12} />
            Đang kết nối: {friends.length} người
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {filteredFriends.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="contacts-empty"
            >
              <Users size={38} />
              <h3>Không tìm thấy tài khoản nào khớp</h3>
              <p>Bấm "Thêm bạn mới" để tìm kiếm người dùng trong hệ thống.</p>
            </motion.div>
          ) : (
            <motion.div key="grid" layout className="contacts-grid">
              {filteredFriends.map((friend) => {
                const status = getStatus(friend.last_seen);
                return (
                  <motion.div
                    key={friend.id}
                    layoutId={friend.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="contacts-card"
                  >
                    {/* <button
                      className="contacts-delete-btn"
                      onClick={() => handleDelete(friend.id, friend.username)}
                      title="Xóa kết nối"
                    >
                      <Trash2 size={13} />
                    </button> */}

                    <div className="contacts-card-top">
                      <div className="contacts-card-avatar-wrap">
                        <img
                          src={friend.avatar_url}
                          alt={friend.username}
                          referrerPolicy="no-referrer"
                        />
                        <span
                          className={`contacts-status-dot ${status.isOnline ? "online" : "offline"}`}
                        />
                      </div>
                      <div className="contacts-card-info">
                        <p className="contacts-card-username">
                          @{friend.username}
                        </p>
                        <p className="contacts-card-email">{friend.email}</p>
                        <div className="contacts-card-status">
                          <span
                            className={`contacts-card-status-dot ${status.isOnline ? "online" : "offline"}`}
                          />
                          <span className="contacts-card-status-text">
                            {status.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="contacts-card-footer">
                      <button className="contacts-action-primary">
                        <MessageSquare size={13} />
                        Nhắn tin
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
