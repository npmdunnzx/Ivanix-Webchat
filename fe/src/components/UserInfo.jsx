import { User, UserX, Crown, ShieldCheck } from "lucide-react";
import "../assets/styles/userinfo.css";

function UserInfo(props) {
  const { userInfo, isAdmin, currentUserId, onRemove, onTransferAdmin } = props;
  const isSelf = userInfo?.id === currentUserId;
  const isMemberAdmin = userInfo?.role === "admin";
  const canRemove = isAdmin && !isSelf && onRemove;
  const canTransfer = isAdmin && !isSelf && !isMemberAdmin && onTransferAdmin;

  return (
    <div className="user-info-card">
      <div className="user-avatar">
        {userInfo?.avatar_url || userInfo?.avatar ? (
          <img src={userInfo.avatar_url || userInfo.avatar} alt="User's avatar" />
        ) : (
          <User size={20} />
        )}
      </div>
      <div className="user-details">
        <div className="user-name-row">
          <p className="user-name fw-bold">{userInfo?.username || "Unknown User"}</p>
        </div>
        {isMemberAdmin && (
          <span className="admin-badge" title="Quản trị viên">
            <Crown size={12} />
            <span>Trưởng nhóm</span>
          </span>
        )}
      </div>
      <div className="user-actions" style={{ display: "flex", gap: "4px" }}>
        {canTransfer && (
          <button
            type="button"
            className="btn-remove-member"
            title="Chuyển quyền Trưởng nhóm"
            onClick={(e) => {
              e.stopPropagation();
              onTransferAdmin(userInfo);
            }}
          >
            <ShieldCheck size={15} />
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            className="btn-remove-member"
            title="Xóa khỏi nhóm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(userInfo);
            }}
          >
            <UserX size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default UserInfo;