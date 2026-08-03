import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import userApi from "../apis/user.apis.js";
import defaultAvatar from "../assets/images/user_avatar.png";
import { Camera, LogOut, User, Mail, CheckCircle2, Loader2, ShieldCheck, Moon, Bell, Eye, X } from "lucide-react";
import toast from "react-hot-toast";
import "../assets/styles/settings.css";
import "../assets/styles/messageattachments.css";

function Settings() {
  const { userInfo, setUserInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState(userInfo?.username || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo?.username) {
      setUsername(userInfo.username);
    }
  }, [userInfo]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh (PNG, JPG, JPEG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng ảnh tối đa là 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploadingAvatar(true);
    const toastId = toast.loading("Đang tải ảnh lên...");

    try {
      const response = await userApi.updateProfile(formData);
      setUserInfo((prev) => ({
        ...prev,
        avatar_url: response.user?.avatar_url || prev.avatar_url,
      }));
      toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(error.response?.data?.message || "Không thể tải ảnh đại diện", { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Tên người dùng không được để trống");
      return;
    }

    if (username.trim() === userInfo?.username) {
      toast("Không có thay đổi nào được thực hiện", { icon: "ℹ️" });
      return;
    }

    setIsUpdatingProfile(true);
    const formData = new FormData();
    formData.append("username", username.trim());

    try {
      const response = await userApi.updateProfile(formData);
      setUserInfo((prev) => ({
        ...prev,
        username: response.user?.username || prev.username,
      }));
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đã đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1>Cài Đặt Tài Khoản</h1>
          <p>Quản lý thông tin hồ sơ và tùy chọn ứng dụng của bạn</p>
        </header>

        <div className="settings-grid">
          {/* Main Profile Card */}
          <div className="settings-card profile-card">
            <div className="avatar-section">
              <div className="avatar-wrapper" onClick={() => setShowAvatarModal(true)} title="Xem ảnh đại diện">
                <img
                  src={userInfo?.avatar_url || defaultAvatar}
                  alt={userInfo?.username || "Avatar"}
                  className="avatar-img"
                />
                <div className="avatar-overlay">
                  {isUploadingAvatar ? (
                    <Loader2 size={24} className="spinner" />
                  ) : (
                    <Eye size={24} />
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
              />
              <div className="settings-user-info">
                <h3>{userInfo?.username || "Người dùng"}</h3>
                <p className="user-email-text">{userInfo?.email}</p>
                <div className="avatar-action-buttons">
                  <button
                    type="button"
                    className="view-avatar-btn"
                    onClick={() => setShowAvatarModal(true)}
                  >
                    <Eye size={15} /> Xem ảnh
                  </button>
                  <button
                    type="button"
                    className="change-avatar-btn"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                  >
                    <Camera size={15} /> {isUploadingAvatar ? "Đang tải..." : "Đổi ảnh"}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="settings-form-group">
                <label>
                  <User size={16} /> Tên người dùng
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên người dùng mới"
                  maxLength={30}
                />
              </div>

              <div className="settings-form-group">
                <label>
                  <Mail size={16} /> Email đăng ký
                </label>
                <div className="input-with-badge">
                  <input type="email" value={userInfo?.email || ""} disabled />
                  <span className="verified-badge">
                    <CheckCircle2 size={14} /> Đã xác thực
                  </span>
                </div>
              </div>

              <div className="settings-form-actions">
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isUpdatingProfile || username.trim() === userInfo?.username}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Secondary Quick Settings Card */}
          <div className="settings-card options-card">
            <h2>Tùy Chọn Khác</h2>
            <div className="options-list">
              <div className="option-item">
                <div className="option-icon">
                  <Bell size={18} />
                </div>
                <div className="option-text">
                  <span>Thông báo tin nhắn</span>
                  <p>Nhận thông báo khi có tin nhắn mới</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="option-item">
                <div className="option-icon">
                  <Moon size={18} />
                </div>
                <div className="option-text">
                  <span>Giao diện tối (Dark Mode)</span>
                  <p>Tối ưu giao diện cho ban đêm</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="option-item">
                <div className="option-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="option-text">
                  <span>Bảo mật tài khoản</span>
                  <p>Xác thực 2 lớp và quản lý phiên đăng nhập</p>
                </div>
                <span className="option-badge">Bảo mật</span>
              </div>
            </div>
          </div>

          {/* Logout Danger Zone */}
          <div className="settings-card logout-card">
            <div className="logout-content">
              <div className="logout-info">
                <h3>Đăng xuất khỏi thiết bị</h3>
                <p>Bạn sẽ cần đăng nhập lại để xem và gửi tin nhắn mới</p>
              </div>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Lightbox Modal */}
      {showAvatarModal && (
        <div className="msg-lightbox-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="msg-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="msg-lightbox-header" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="msg-lightbox-btn"
                onClick={() => setShowAvatarModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="msg-lightbox-body">
              <img
                src={userInfo?.avatar_url || defaultAvatar}
                alt="Avatar"
                className="msg-lightbox-img"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;