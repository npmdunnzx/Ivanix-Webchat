import { useState, useEffect, useRef, useContext } from "react";
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
import recommendationService from "../apis/recommendation.apis.js";
import friendService from "../services/friend.service.js";
import userService from "../services/user.service.js";
import {AuthContext} from "../context/AuthContext.jsx";
import debounce from "lodash.debounce";

export default function Contacts() {
  const {userInfo} = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const latestSearchId = useRef(0);
  const searchRef = useRef(null);
  const [searchKeyword, setSearchKeyword] = useState("");  
  const [searchResults, setSearchResults] = useState([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const getrecommendations = await recommendationService.getRecommendation(userInfo.id);
        setRecommendations(getrecommendations.data);
        console.log("Fetched recommendations:", getrecommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [userInfo?.id]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const getfriends = await friendService.getFriends(userInfo.id);
        setFriends(getfriends.data.data);
        console.log("Fetched friends:", getfriends.data.data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, [userInfo?.id]);

  useEffect(() => {
    searchRef.current = debounce(async (keyword) => {
      if (keyword.trim() === "") {
        setSearchResults([]);
        return;
      }
      const requestId = ++latestSearchId.current;
      try {
        const result = keyword.trim() === "" ? [] : await userService.search(keyword);
        if (requestId !== latestSearchId.current) return;
        setSearchResults(result.data);
      } catch (error) {
        console.error("Error searching users:", error.message);
      }
    }, 1000);

    return () => searchRef.current.cancel();
  }, [userInfo?.id]);

  useEffect(() => {
    searchRef.current?.(searchKeyword);
  }, [searchKeyword]);

  const handleInputChange = (e) => {
    setSearchKeyword(e.target.value);
  }

  return (
    <div className="contacts-page">
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
                      value={searchKeyword}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="contacts-db-section">
                  <p className="contacts-db-label">
                    Danh sách tìm kiếm
                  </p>
      {searchResults?.length === 0 ? (
                <div className="recommendation-section">
                  <h3>
                    <Sparkles size={14} /> Gợi ý kết nối ({recommendations?.length})
                  </h3>
                  <div className="recommendation-grid">
                    {recommendations?.length === 0 ? (
                      <div className="recommendation-empty">
                        Không có gợi ý kết nối nào. Hãy thử kết nối với nhiều người dùng hơn để nhận được gợi ý.
                      </div>
                    ) : (
                      recommendations.map((user) => {
                        const status = "";
                        return (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="recommendation-card"
                          >
                            <div className="recommendation-card-left">
                              <div className="contacts-avatar-wrap">
                                <img
                                  src={user.avatar_url || user_avatar}
                                  alt={user.username}
                                  referrerPolicy="no-referrer"
                                />
                                <span
                                  className={`contacts-status-dot ${status.isOnline ? "online" : "offline"}`}
                                />
                              </div>
                              <div className="recommendation-info">
                                <div className="recommendation-name-row">
                                  <span className="recommendation-username">
                                    {user.username}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              className="recommendation-connect-btn"
                              // onClick={() => handleAdd(user)}
                            >
                              <UserPlus size={12} />
                              Thêm bạn bè
                            </button>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
                  ) : (
                    <div className="contacts-db-grid">
                      {searchResults.map((user) => {
                        const status = "";
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
                                  src={user.avatar_url || user_avatar}
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
                                    {user.username}
                                  </span>
                                </div>
                                <p className="contacts-db-email">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <button
                              className="contacts-connect-btn"
                              // onClick={() => handleAdd(user)}
                            >
                              <UserPlus size={12} />
                              Thêm bạn bè
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
              // value={}
              // onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <div className="contacts-count">
            <Clock size={12} />
            Đang kết nối: {friends.length} người
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {friends?.length === 0 ? (
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
              {friends.map((friend) => {
                const status = "";
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
                          {friend.username}
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
