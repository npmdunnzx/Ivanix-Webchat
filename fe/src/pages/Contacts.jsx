import { useState, useEffect, useRef, useContext } from "react";
import {
  Users,
  Search as SearchIcon,
  MessageSquare,
  Sparkles,
  UserPlus,
  X,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import "../assets/styles/contacts.css";
import user_avatar from "../assets/images/user_avatar.png";
import recommendationService from "../apis/recommendation.apis.js";
import friendService from "../services/friend.service.js";
import userService from "../services/user.service.js";
import { AuthContext } from "../context/AuthContext.jsx";
import debounce from "lodash.debounce";
import convService from "../services/conversation.service.js";
import NewContactInfo from "../components/NewContactInfo.jsx";
import {useNavigate} from "react-router-dom";

const TABS = {
  FRIENDS: 'friends',
  ADD_FRIEND: 'add_friend',
  RECEIVED_REQUESTS: 'received_requests',
  SENT_REQUESTS: 'sent_requests',
};

export default function Contacts() {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const latestSearchId = useRef(0);
  const searchRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = () => setRefreshKey((k) => k + 1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.FRIENDS);
  const [activeFilter, setActiveFilter] = useState("all");
  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const getrecommendations = await recommendationService.getRecommendation(userInfo.id);
        setRecommendations(getrecommendations.data);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [userInfo?.id, refreshKey]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const getfriends = await friendService.getFriends(userInfo.id);
        setFriends(getfriends.data.data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, [userInfo?.id, refreshKey]);

  useEffect(() => {
    const getMyRequests = async () => {
      try {
        const result = await friendService.getMyRequests();
        setMyRequests(result.data.data);
      } catch (error) {
        console.error("Error fetching my requests:", error);
      }
    };
    getMyRequests();
  }, [userInfo?.id, refreshKey]);

  useEffect(() => {
    const getPendingRequests = async () => {
      try {
        const result = await friendService.getPendingRequests();
        setPendingRequests(result.data.data);
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      }
    };

    getPendingRequests();
  }, [userInfo?.id, refreshKey]);

  useEffect(() => {
    searchRef.current = debounce(async (keyword) => {
      if (keyword.trim() === "") {
        setSearchResults([]);
        return;
      }
      const requestId = ++latestSearchId.current;
      try {
        const result = await userService.search(keyword);
        if (requestId !== latestSearchId.current) return;
        setSearchResults(result.data);
        console.log("result", result.data);
      } catch (error) {
        console.error("Error searching users:", error.message);
      }
    }, 1000);

    return () => searchRef.current.cancel();
  }, [refreshKey]);

  useEffect(() => {
    searchRef.current?.(searchKeyword);
  }, [searchKeyword]);

  const handleInputChange = (e) => {
    setSearchKeyword(e.target.value);
  }

  const handleStartChat = async (friend) => {
    try {
      const res = await convService.checkExistChat(friend.id);
      if (res.success && res.data) {
        const convId = res.data.result?.conversationId || res.data.conversationId || res.data.id;
        if (convId) {
          navigate(`/chat/private/${convId}`);
        }
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  }

  return (
    <div className="contacts-page">
      <div className="contacts-inner">

        {/* Navigation Tabs */}
        <div className="contacts-nav-container">
          <div className="contacts-tabs">
            <button
              className={`contacts-tab ${activeTab === TABS.FRIENDS ? "active" : ""}`}
              onClick={() => setActiveTab(TABS.FRIENDS)}
            >
              <Users size={16} /> Bạn bè
            </button>
            <button
              className={`contacts-tab ${activeTab === TABS.ADD_FRIEND ? "active" : ""}`}
              onClick={() => setActiveTab(TABS.ADD_FRIEND)}
            >
              <UserPlus size={16} /> Thêm bạn bè
            </button>
            <button
              className={`contacts-tab ${activeTab === TABS.RECEIVED_REQUESTS ? "active" : ""}`}
              onClick={() => setActiveTab(TABS.RECEIVED_REQUESTS)}
            >
              <UserPlus size={16} /> Yêu cầu đã nhận <span className="contacts-badge red">{pendingRequests.length}</span>
            </button>
            <button
              className={`contacts-tab ${activeTab === TABS.SENT_REQUESTS ? "active" : ""}`}
              onClick={() => setActiveTab(TABS.SENT_REQUESTS)}
            >
              <Clock size={16} /> Yêu cầu đã gửi <span className="contacts-badge">{myRequests.length}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="contacts-content">
          {activeTab === TABS.FRIENDS && (
            <>
              <div className="contacts-content-header">
                <div className="contacts-content-title">
                  <h2>Danh sách bạn bè ({friends.length}) </h2>
                  <p>Xem danh sách tất cả những người bạn đã kết nối trên Ivanix.</p>
                </div>
                <div className="contacts-filter-pills">
                  <button className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>Tất cả</button>
                  <button className={`filter-pill ${activeFilter === 'recent' ? 'active' : ''}`} onClick={() => setActiveFilter('recent')}>Gần đây</button>
                  <button className={`filter-pill ${activeFilter === 'favorite' ? 'active' : ''}`} onClick={() => setActiveFilter('favorite')}>Yêu thích</button>
                </div>
              </div>

              {friends?.length === 0 ? (
                <div className="contacts-empty">
                  <Users size={38} />
                  <h3>Chưa có bạn bè nào</h3>
                  <p>Chuyển sang mục "Thêm bạn bè" để kết nối.</p>
                </div>
              ) : (
                <motion.div layout className="contacts-grid">
                  <AnimatePresence>
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        layoutId={friend.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ duration: 0.18 }}
                        className="contacts-card"
                      >
                        <div className="contacts-card-top">
                          <div className="contacts-card-avatar-wrap">
                            <img
                              src={friend.avatar_url || user_avatar}
                              alt={friend.username}
                              referrerPolicy="no-referrer"
                            />
                            <span
                              className={`contacts-status-dot online`}
                            />
                          </div>
                          <div className="contacts-card-info">
                            <p className="contacts-card-username">
                              {friend.username}
                            </p>
                          </div>
                        </div>

                        <div className="contacts-card-footer">
                          <button className="contacts-action-primary" onClick={() => handleStartChat(friend)}>
                            <MessageSquare size={13} />
                            Nhắn tin
                          </button>
                          <button className="contacts-action-more">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}

          {activeTab === TABS.ADD_FRIEND && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="contacts-content-header">
                <div className="contacts-content-title">
                  <h2>Thêm bạn bè</h2>
                  <p>Tìm kiếm và kết nối với những người dùng khác.</p>
                </div>
              </div>

              <div className="contacts-search-large">
                <SearchIcon size={18} className="search-icon" />
                <input
                  placeholder="Nhập tên tài khoản để tìm kiếm, ví dụ: baotram..."
                  value={searchKeyword}
                  onChange={handleInputChange}
                />
                {searchKeyword && (
                  <button className="clear-search" onClick={() => setSearchKeyword("")}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="contacts-add-results">
                {searchKeyword.trim() !== "" ? (
                  <div className="contacts-db-section">
                    <p className="contacts-db-label">Kết quả tìm kiếm ({searchResults.length})</p>
                    {searchResults.length === 0 ? (
                      <div className="contacts-db-empty">
                        Không tìm thấy người dùng nào với từ khóa "{searchKeyword}"
                      </div>
                    ) : (
                      <div className="container">
                        <div className="row row-cols-md-4 text-center">
                        {searchResults.map((user) => (
                          <NewContactInfo key={user.id} user={user} onAction={bumpRefresh} />
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="recommendation-section">
                    <p className="contacts-db-label">
                      <Sparkles size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--sidebar-primary)' }} />
                      Gợi ý kết nối ({recommendations?.length})
                    </p>
                    <div className="container">
                      <div className="row row-cols-md-4 text-center">
                      {recommendations?.length === 0 ? (
                        <div className="recommendation-empty">
                          Không có gợi ý kết nối nào lúc này.
                        </div>
                      ) : (
                        recommendations.map((user) => (
                          <NewContactInfo key={user.id} user={user} onAction={bumpRefresh} />
                        ))
                      )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === TABS.RECEIVED_REQUESTS && (
            pendingRequests.length === 0 ? (
              <div className="contacts-empty">
                <Clock size={38} />
                <h3>Chưa có yêu cầu nào được gửi đến</h3>
              </div>
            ) : (
              <div className="container">
                <div className="row row-cols-md-4 text-center">
                  {pendingRequests.map((request) => (
                    <NewContactInfo key={request.id} user={{...request, rel_status: "request_received"}} onAction={bumpRefresh} />
                  ))}
                </div>
              </div>
            )
          )}

          {activeTab === TABS.SENT_REQUESTS && (
            myRequests.length === 0 ? (
              <div className="contacts-empty">
                <Clock size={38} />
                <h3>Chưa có yêu cầu nào được gửi đi</h3>
              </div>
            ) : (
              <div className="container">
                <div className="row row-cols-md-4 text-center">
                  {myRequests.map((request) => (
                    <NewContactInfo key={request.id} user={{...request, rel_status: "request_sent"}} onAction={bumpRefresh} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
