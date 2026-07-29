import "../assets/styles/chatinfo.css";
import {
  Users,
  Info,
  BookOpen,
  ChevronDown,
  ShieldAlert,
  Edit3,
} from "lucide-react";
import { useEffect, useState, useCallback, useContext } from "react";
import convService from "../services/conversation.service.js";
import { AuthContext } from "../context/AuthContext.jsx";
import UserInfo from "./UserInfo.jsx";
import AddMemberModal from "./AddMemberModal.jsx";
import RenameGroupModal from "./RenameGroupModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import { notifyError, notifySuccess } from "../utils/toast.js";

function ChatInfo(props) {
  const { userInfo } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [isMembersOpen, setIsMembersOpen] = useState(true);

  // Modal states
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isDeleteHistoryConfirmOpen, setIsDeleteHistoryConfirmOpen] = useState(false);
  const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] = useState(false);

  // Member to remove / transfer admin state
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberToTransfer, setMemberToTransfer] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Action loadings
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const conversationInfo = props.conversation;

  const fetchGroupMembers = useCallback(async () => {
    if (!conversationInfo?.id) return;
    try {
      const result = await convService.getGroupMembers(conversationInfo.id);
      const list = result.data?.result || result.data || [];
      setMembers(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log("Could not get group's member:" + error.message);
    }
  }, [conversationInfo?.id]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  // Check if current logged-in user is admin of this group
  const currentUserMember = members.find((m) => m.id === userInfo?.id);
  const isAdmin = currentUserMember?.role === "admin";
  const adminCount = members.filter((m) => m.role === "admin").length;
  const isLastAdmin = isAdmin && adminCount === 1;

  // Handle Remove Member (Admin action)
  const handleRemoveMember = async () => {
    if (!memberToRemove || !conversationInfo?.id) return;
    setIsRemovingMember(true);
    try {
      const res = await convService.removeGroupMember(
        conversationInfo.id,
        memberToRemove.id,
      );
      if (res.success) {
        notifySuccess(`Đã xóa ${memberToRemove.username} khỏi nhóm!`);
        setMemberToRemove(null);
        fetchGroupMembers();
      } else {
        const msg = res.listErr?.[0]?.msg || "Không thể xóa thành viên!";
        notifyError(msg);
      }
    } catch (err) {
      console.error("Error removing group member:", err);
      notifyError("Có lỗi xảy ra khi xóa thành viên!");
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Handle Transfer Admin
  const handleTransferAdmin = async () => {
    if (!memberToTransfer || !conversationInfo?.id) return;
    setIsTransferring(true);
    try {
      const res = await convService.transferAdmin(
        conversationInfo.id,
        memberToTransfer.id,
      );
      if (res.success) {
        notifySuccess(`Đã chuyển quyền Admin cho ${memberToTransfer.username}!`);
        setMemberToTransfer(null);
        fetchGroupMembers();
      } else {
        const msg = res.listErr?.[0]?.msg || "Không thể chuyển quyền Admin!";
        notifyError(msg);
      }
    } catch (err) {
      console.error("Error transferring admin:", err);
      notifyError("Có lỗi xảy ra khi chuyển quyền Admin!");
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle Leave Conversation
  const handleLeaveConversation = async () => {
    if (!conversationInfo?.id) return;
    setIsLeaving(true);
    try {
      const res = await convService.leaveConversation(conversationInfo.id);
      if (res.success) {
        notifySuccess("Đã rời khỏi cuộc trò chuyện!");
        setIsLeaveConfirmOpen(false);
        if (props.onConversationRemoved) {
          props.onConversationRemoved(conversationInfo.id);
        }
      } else {
        const msg = res.listErr?.[0]?.msg || "Không thể rời cuộc trò chuyện!";
        notifyError(msg);
      }
    } catch (err) {
      console.error("Error leaving conversation:", err);
      notifyError("Có lỗi xảy ra khi rời cuộc trò chuyện!");
    } finally {
      setIsLeaving(false);
    }
  };

  // Handle Delete History
  const handledelConversationHistory = async () => {
    if (!conversationInfo?.id) return;
    setIsDeletingHistory(true);
    try {
      const res = await convService.delConversationHistory(conversationInfo.id);
      if (res.success) {
        notifySuccess("Đã xóa lịch sử cuộc trò chuyện!");
        setIsDeleteHistoryConfirmOpen(false);
        if (props.onHistoryCleared) {
          props.onHistoryCleared(conversationInfo.id);
        }
      } else {
        const msg =
          res.listErr?.[0]?.msg || "Không thể xóa lịch sử cuộc trò chuyện!";
        notifyError(msg);
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      notifyError("Có lỗi xảy ra khi xóa lịch sử cuộc trò chuyện!");
    } finally {
      setIsDeletingHistory(false);
    }
  };

  // Handle Delete Group (Admin only — hard delete)
  const handleDeleteGroupConversation = async () => {
    if (!conversationInfo?.id) return;
    setIsDeletingGroup(true);
    try {
      const res = await convService.deleteGroupConversation(conversationInfo.id);
      if (res.success) {
        notifySuccess("Đã giải tán nhóm!");
        setIsDeleteGroupConfirmOpen(false);
        if (props.onConversationRemoved) {
          props.onConversationRemoved(conversationInfo.id);
        }
      } else {
        const msg = res.listErr?.[0]?.msg || "Không thể giải tán nhóm!";
        notifyError(msg);
      }
    } catch (err) {
      console.error("Error deleting group:", err);
      notifyError("Có lỗi xảy ra khi giải tán nhóm!");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  return (
    <div className={`chat-info ${props.isOpen === true ? "" : "hidden"}`}>
      {conversationInfo && (
        <div className="detail-info-chat">
          {(conversationInfo.partner_avatar && (
            <img
              src={conversationInfo.partner_avatar}
              alt="User's avatar"
              className="avatar-info"
            />
          )) || <Users className="avatar-info" />}
          <div className="chat-info-name-wrapper">
            <p className="name-info">
              {conversationInfo.name || conversationInfo.partner_username}
            </p>
            {conversationInfo.type === "group" || conversationInfo.name ? (
              <button
                className="btn-edit-name"
                title="Đổi tên nhóm"
                onClick={() => setIsRenameOpen(true)}
              >
                <Edit3 size={15} />
              </button>
            ) : null}
          </div>
        </div>
      )}

      {conversationInfo?.name || conversationInfo?.type === "group" ? (
        <div className="member-info info-1">
          <div className="member-header">
            <p>
              <Info /> Thành viên ({members?.length || 0})
            </p>
            <button
              onClick={() => setIsMembersOpen(!isMembersOpen)}
              className={`${isMembersOpen ? "open" : ""}`}
            >
              <ChevronDown />
            </button>
          </div>
          <div className={`member-list ${isMembersOpen ? "" : "hidden"}`}>
            <button
              className="btn btn-primary add-member"
              onClick={() => setIsAddMemberOpen(true)}
            >
              Thêm thành viên
            </button>
            {members?.map((member) => (
              <UserInfo
                key={member.id}
                userInfo={member}
                isAdmin={isAdmin}
                currentUserId={userInfo?.id}
                onRemove={(m) => setMemberToRemove(m)}
                onTransferAdmin={(m) => setMemberToTransfer(m)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="info-1">
          <p></p>
        </div>
      )}

      <div className="resource-info info-1">
        <p>
          <BookOpen /> Tài nguyên
        </p>
      </div>

      <div className="privacy-info info-1">
        <p>
          <ShieldAlert /> Quyền riêng tư
        </p>
        {conversationInfo?.type === "group" || conversationInfo?.name ? (
          <button
            className="btn btn-danger leave-chat"
            onClick={() => {
              if (isLastAdmin) {
                notifyError("Bạn là Admin duy nhất. Hãy chuyển quyền Admin trước khi rời nhóm.");
                return;
              }
              setIsLeaveConfirmOpen(true);
            }}
            title={isLastAdmin ? "Chuyển quyền Admin trước khi rời nhóm" : ""}
          >
            Rời khỏi cuộc trò chuyện
          </button>
        ) : null}
        {conversationInfo && (
          <button
            className="btn btn-danger delete-chat"
            onClick={() => setIsDeleteHistoryConfirmOpen(true)}
          >
            Xóa lịch sử cuộc trò chuyện
          </button>
        )}
        {isAdmin && (conversationInfo?.type === "group" || conversationInfo?.name) && (
          <button
            className="btn btn-danger delete-chat"
            onClick={() => setIsDeleteGroupConfirmOpen(true)}
          >
            Giải tán nhóm
          </button>
        )}
      </div>

      {/* Modal Add Member */}
      {conversationInfo && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          conversationId={conversationInfo.id}
          existingMembers={members}
          onMembersAdded={fetchGroupMembers}
        />
      )}

      {/* Modal Rename Group */}
      {conversationInfo && (
        <RenameGroupModal
          isOpen={isRenameOpen}
          onClose={() => setIsRenameOpen(false)}
          conversationId={conversationInfo.id}
          currentName={conversationInfo.name || ""}
          onGroupRenamed={(newName) => {
            if (props.onGroupRenamed) {
              props.onGroupRenamed(conversationInfo.id, newName);
            }
          }}
        />
      )}

      {/* Modal Confirm Remove Member (Admin) */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Xóa thành viên khỏi nhóm"
        message={`Bạn có chắc chắn muốn xóa "${memberToRemove?.username}" khỏi nhóm không?`}
        confirmText="Xóa thành viên"
        cancelText="Hủy"
        isDanger={true}
        isLoading={isRemovingMember}
      />

      {/* Modal Confirm Transfer Admin */}
      <ConfirmModal
        isOpen={!!memberToTransfer}
        onClose={() => setMemberToTransfer(null)}
        onConfirm={handleTransferAdmin}
        title="Chuyển quyền Admin"
        message={`Bạn có chắc chắn muốn chuyển quyền Admin cho "${memberToTransfer?.username}" không? Bạn sẽ trở thành thành viên thường.`}
        confirmText="Chuyển quyền"
        cancelText="Hủy"
        isDanger={false}
        isLoading={isTransferring}
      />

      {/* Modal Confirm Leave Chat */}
      <ConfirmModal
        isOpen={isLeaveConfirmOpen}
        onClose={() => setIsLeaveConfirmOpen(false)}
        onConfirm={handleLeaveConversation}
        title="Rời khỏi cuộc trò chuyện"
        message={`Bạn có chắc chắn muốn rời khỏi nhóm "${conversationInfo?.name || "này"}" không?`}
        confirmText="Rời nhóm"
        cancelText="Hủy"
        isDanger={true}
        isLoading={isLeaving}
      />

      {/* Modal Confirm Delete History */}
      <ConfirmModal
        isOpen={isDeleteHistoryConfirmOpen}
        onClose={() => setIsDeleteHistoryConfirmOpen(false)}
        onConfirm={handledelConversationHistory}
        title="Xóa lịch sử cuộc trò chuyện"
        message="Bạn có chắc chắn muốn xóa lịch sử cuộc trò chuyện này? Chỉ bạn mới bị ảnh hưởng."
        confirmText="Xóa lịch sử"
        cancelText="Hủy"
        isDanger={true}
        isLoading={isDeletingHistory}
      />

      {/* Modal Confirm Delete Group (Admin only) */}
      <ConfirmModal
        isOpen={isDeleteGroupConfirmOpen}
        onClose={() => setIsDeleteGroupConfirmOpen(false)}
        onConfirm={handleDeleteGroupConversation}
        title="Giải tán nhóm"
        message={`Bạn có chắc chắn muốn giải tán nhóm "${conversationInfo?.name || ""}"? Toàn bộ tin nhắn và dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
        confirmText="Giải tán nhóm"
        cancelText="Hủy"
        isDanger={true}
        isLoading={isDeletingGroup}
      />
    </div>
  );
}

export default ChatInfo;
