import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, X, Search, Check, Loader2 } from "lucide-react";
import friendService from "../services/friend.service.js";
import convService from "../services/conversation.service.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { notifyError, notifySuccess } from "../utils/toast.js";
import userAvatarDefault from "../assets/images/user_avatar.png";
import "../assets/styles/CreateGroupModal.css";

function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { userInfo } = useContext(AuthContext);
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchMemberKeyword, setSearchMemberKeyword] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await friendService.getFriends(userInfo?.id);
      if (res.success && res.data) {
        const list = res.data.data || res.data.result || res.data || [];
        setFriends(Array.isArray(list) ? list : []);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách bạn bè:", err);
      notifyError("Không thể tải danh sách bạn bè");
    } finally {
      setLoadingFriends(false);
    }
  };
  // Fetch friends list when modal opens
  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setSelectedMemberIds([]);
      setSearchMemberKeyword("");
      fetchFriends();
    }
  }, [isOpen]);

  const toggleSelectMember = (friendId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      notifyError("Vui lòng nhập tên nhóm!");
      return;
    }

    if (selectedMemberIds.length === 0) {
      notifyError("Vui lòng chọn ít nhất 1 thành viên!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await convService.newGroupChat(groupName.trim(), selectedMemberIds);
      if (res.success && res.data) {
        notifySuccess("Tạo nhóm mới thành công!");
        const newConv = res.data.result || res.data;
        if (onGroupCreated) {
          onGroupCreated(newConv);
        }
        onClose();
      } else {
        const errMsg =
          res.listErr?.[0]?.msg || "Không thể tạo nhóm. Vui lòng thử lại sau!";
        notifyError(errMsg);
      }
    } catch (err) {
      console.error("Lỗi khi tạo nhóm:", err);
      notifyError("Có lỗi xảy ra khi tạo nhóm!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter friends list by keyword
  const filteredFriends = friends.filter((friend) => {
    const name = friend.username || friend.name || "";
    return name.toLowerCase().includes(searchMemberKeyword.toLowerCase().trim());
  });

  const selectedFriends = friends.filter((f) => selectedMemberIds.includes(f.id));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="create-group-backdrop" onClick={onClose}>
        <motion.div
          className="create-group-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="create-group-header">
            <div className="create-group-title">
              <Users size={22} className="title-icon" />
              <h3>Tạo nhóm mới</h3>
            </div>
            <button className="create-group-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateGroup} className="create-group-body">
            {/* Input Group Name */}
            <div className="form-group">
              <label htmlFor="groupName">Tên nhóm</label>
              <input
                id="groupName"
                type="text"
                className="group-input group-modal"
                placeholder="Nhập tên nhóm..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                autoFocus
              />
            </div>

            {/* Member Selection Section */}
            <div className="form-group">
              <label>Thêm thành viên ({selectedMemberIds.length})</label>

              {/* Search Friends */}
              <div className="member-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm bạn bè..."
                  className="group-input group-modal"
                  value={searchMemberKeyword}
                  onChange={(e) => setSearchMemberKeyword(e.target.value)}
                />
              </div>

              {/* Selected Chips */}
              {selectedFriends.length > 0 && (
                <div className="selected-members-chips">
                  {selectedFriends.map((friend) => (
                    <span key={friend.id} className="member-chip">
                      <img
                        src={friend.avatar_url || userAvatarDefault}
                        alt={friend.username}
                      />
                      <span className="chip-name">{friend.username}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectMember(friend.id)}
                        className="chip-remove"
                        style={{ padding: "14px 14px 14px 14px" }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Friends List */}
              <div className="friends-selection-list">
                {loadingFriends ? (
                  <div className="loading-state">
                    <Loader2 size={24} className="spin-icon" />
                    <span>Đang tải danh sách bạn bè...</span>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="empty-state">
                    {searchMemberKeyword ? "Không tìm thấy bạn bè phù hợp" : "Chưa có bạn bè nào"}
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    const isSelected = selectedMemberIds.includes(friend.id);
                    return (
                      <div
                        key={friend.id}
                        className={`friend-item ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleSelectMember(friend.id)}
                      >
                        <div className="friend-info">
                          <img
                            src={friend.avatar_url || userAvatarDefault}
                            alt={friend.username}
                            className="friend-avatar"
                          />
                          <span className="friend-name">{friend.username}</span>
                        </div>
                        <div className={`checkbox-custom ${isSelected ? "checked" : ""}`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="create-group-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  "Tạo nhóm"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CreateGroupModal;
