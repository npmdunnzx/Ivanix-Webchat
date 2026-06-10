import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Users, BarChart3, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "../assets/styles/sidebar.css";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

const navItems = [
  { icon: MessageSquare, label: "Tin nhắn", path: "/chat" },
  { icon: Users, label: "Danh bạ", path: "/contacts" },
  { icon: BarChart3, label: "Lưu trữ", path: "/storage" },
];

const channels = [
  {
    id: "1",
    name: "General Channel",
    unread: false,
    status: "Hùng: Cập nhật code mới nhất...",
    time: "12:45",
  },
  {
    id: "2",
    name: "Design System",
    unread: true,
    status: "Lan: File Figma đã được update...",
    time: "09:12",
  },
  {
    id: "3",
    name: "Báo lỗi QA",
    unread: false,
    status: "Bạn: Đã fix xong issue #452",
    time: "Hôm qua",
  },
];

const cx = (...classes) => classes.filter(Boolean).join(" ");

function Sidebar() {
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isChat = pathname.startsWith("/chat");


  return (
    <motion.aside
      animate={{ width: isChat ? 320 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sidebar"
    >
      <motion.div
        animate={{ width: isChat ? 64 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sidebar-rail"
      >
        <div className={cx("sidebar-header", isChat && "sidebar-header-collapsed")}>
          <button className="sidebar-icon" onClick={() => navigate("/contacts")}>
            I
          </button>
          {!isChat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="sidebar-title"
            >
              <h1>Ivanix</h1>
              <p>WORKSPACE</p>
            </motion.div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                className={cx(
                  "nav-item",
                  isActive && "active",
                  isChat && "nav-item-collapsed"
                )}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <item.icon size={20} />
                {!isChat && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="nav-label"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="profile-section">
          <button
            className={cx("profile-button", isChat && "profile-button-collapsed")}
            title="View Profile"
          >
            <div className="profile-icon">{userInfo?.username.charAt(0).toUpperCase() || "A"}</div>
            {!isChat && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="profile-info"
              >
                <p>{userInfo?.username || "Admin"}</p>
                <p>View Profile</p>
              </motion.div>
            )}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="messages-panel"
          >
            <div className="messages-header">
              <div className="messages-title-row">
                <h2>Tin nhắn</h2>
                <button className="messages-add-button" title="Tạo tin nhắn">
                  <Plus size={20} />
                </button>
              </div>

              <div className="messages-search">
                <Plus size={16} />
                <input placeholder="Tìm tin nhắn..." />
              </div>
            </div>

            <div className="channel-list">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  className={cx("channel-item", channel.id === "1" && "active")}
                >
                  <div className="channel-avatar">
                    <Users size={18} />
                    {channel.unread && <span className="unread-dot" />}
                  </div>
                  <div className="channel-content">
                    <div className="channel-heading">
                      <p>{channel.name}</p>
                      <span>{channel.time}</span>
                    </div>
                    <p className="channel-status">{channel.status}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

export default Sidebar;
