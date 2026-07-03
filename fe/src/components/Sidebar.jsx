import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Users, BarChart3, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "../assets/styles/sidebar.css";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import user_avatar from "../assets/images/user_avatar.png";

const navItems = [
  { icon: MessageSquare, label: "Tin nhắn", path: "/chat" },
  { icon: Users, label: "Danh bạ", path: "/contacts" },
  { icon: BarChart3, label: "Lưu trữ", path: "/storage" },
];

const cx = (...classes) => classes.filter(Boolean).join(" ");

function Sidebar() {
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isChat = pathname.startsWith("/chat");

  return (
    <motion.aside
      animate={{ width: isChat ? 64 : 280 }}
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
            <div className="profile-icon">
              <img src={user_avatar} alt="Profile" />
            </div>
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
    </motion.aside>
  );
}

export default Sidebar;
