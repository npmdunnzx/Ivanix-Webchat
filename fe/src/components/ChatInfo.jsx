import "../assets/styles/chatinfo.css";
import {
  Users,
  Info,
  BookOpen,
  ChevronDown,
  ShieldAlert,
  Edit3,
  Image,
  Film,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { useEffect, useState, useCallback, useContext } from "react";
import { createPortal } from "react-dom";
import convService from "../services/conversation.service.js";
import { AuthContext } from "../context/AuthContext.jsx";
import UserInfo from "./UserInfo.jsx";
import AddMemberModal from "./AddMemberModal.jsx";
import RenameGroupModal from "./RenameGroupModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import { notifyError, notifySuccess } from "../utils/toast.js";

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileMeta(att) {
  const url = att.file_url || "";
  const fileName = att.file_name || url.split("/").pop() || "File";
  const mimeType = (att.mime_type || "").toLowerCase();
  const extParts = fileName.split(".");
  const ext = extParts.length > 1 ? extParts.pop().toLowerCase() : "";

  const isImage = mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  const isVideo = mimeType.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);

  if (isImage) {
    return {
      type: "image",
      fileName,
      url,
      size: formatFileSize(att.file_size),
      icon: Image,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.12)",
    };
  }
  if (isVideo) {
    return {
      type: "video",
      fileName,
      url,
      size: formatFileSize(att.file_size),
      icon: Film,
      color: "#f97316",
      bg: "rgba(249, 115, 22, 0.12)",
    };
  }
  if (mimeType === "application/pdf" || ext === "pdf") {
    return {
      type: "pdf",
      fileName,
      url,
      size: formatFileSize(att.file_size),
      icon: FileText,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.12)",
    };
  }
  if (mimeType.includes("word") || ["doc", "docx"].includes(ext)) {
    return {
      type: "word",
      fileName,
      url,
      size: formatFileSize(att.file_size),
      icon: FileText,
      color: "#2563eb",
      bg: "rgba(37, 99, 235, 0.12)",
    };
  }
  if ( mimeType.includes("excel") || mimeType.includes("spreadsheet") || ["xls", "xlsx", "csv"].includes(ext)) {
    return {
      type: "excel",
      fileName,
      url,
      size: formatFileSize(att.file_size),
      icon: FileSpreadsheet,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.12)",
    };
  }
  return {
    type: "other",
    fileName,
    url,
    size: formatFileSize(att.file_size),
    icon: File,
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.12)",
  };
}

function ChatInfo(props) {
  const { userInfo } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  // Resource states
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [resourceTab, setResourceTab] = useState("media"); // "media" | "file"
  const [attachments, setAttachments] = useState([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

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
  }, [conversationInfo.id]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  // Fetch Attachments for Resources
  const fetchAttachments = useCallback(async () => {
    if (!conversationInfo?.id) return;
    setIsLoadingAttachments(true);
    try {
      const result = await convService.getConversationAttachments(
        conversationInfo.id,
        resourceTab
      );
      const list = result.data?.result || result.data || [];
      setAttachments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Could not fetch conversation attachments:", error);
    } finally {
      setIsLoadingAttachments(false);
    }
  }, [conversationInfo.id, resourceTab]);

  useEffect(() => {
    if (isResourceOpen) {
      fetchAttachments();
    }
  }, [fetchAttachments, isResourceOpen]);

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
        setAttachments([]);
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

      {(conversationInfo?.name || conversationInfo?.type === "group") && (
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
      )}

      {/* Resource Section */}
      <div className="resource-info info-1">
        <div className="resource-header">
          <p>
            <BookOpen /> Tài nguyên
          </p>
          <button
            onClick={() => setIsResourceOpen(!isResourceOpen)}
            className={`${isResourceOpen ? "open" : ""}`}
            title={isResourceOpen ? "Thu gọn" : "Mở rộng"}
          >
            <ChevronDown />
          </button>
        </div>

        {isResourceOpen && (
          <div className="resource-body">
            <div className="resource-tabs">
              <button
                type="button"
                className={`resource-tab-btn ${resourceTab === "media" ? "active" : ""}`}
                onClick={() => setResourceTab("media")}
              >
                <Image size={14} /> Ảnh & Video
              </button>
              <button
                type="button"
                className={`resource-tab-btn ${resourceTab === "file" ? "active" : ""}`}
                onClick={() => setResourceTab("file")}
              >
                <FileText size={14} /> File / Tài liệu
              </button>
            </div>

            <div className="resource-content">
              {isLoadingAttachments ? (
                <div className="resource-loading">
                  <Loader2 size={20} className="spin-icon" />
                  <span>Đang tải tài nguyên...</span>
                </div>
              ) : attachments.length === 0 ? (
                <div className="resource-empty">
                  <span>
                    {resourceTab === "media"
                      ? "Chưa có hình ảnh/video nào"
                      : "Chưa có file/tài liệu nào"}
                  </span>
                </div>
              ) : resourceTab === "media" ? (
                <div className="resource-media-grid">
                  {attachments.map((att) => {
                    const meta = getFileMeta(att);
                    return (
                      <div
                        key={att.id}
                        className="resource-media-item"
                        onClick={() => setPreviewItem(att)}
                        title={meta.fileName}
                      >
                        {meta.type === "video" ? (
                          <>
                            <video src={meta.url} />
                            <div className="resource-video-badge">
                              <Film size={10} />
                            </div>
                          </>
                        ) : (
                          <img src={meta.url} alt={meta.fileName} />
                        )}
                        <div className="resource-media-overlay">
                          <Maximize2 size={16} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="resource-file-list">
                  {attachments.map((att) => {
                    const meta = getFileMeta(att);
                    const IconComp = meta.icon;
                    return (
                      <div key={att.id} className="resource-file-item">
                        <div
                          className="resource-file-icon"
                          style={{ color: meta.color, backgroundColor: meta.bg }}
                        >
                          <IconComp size={18} />
                        </div>
                        <div className="resource-file-details">
                          <span className="resource-file-name" title={meta.fileName}>
                            {meta.fileName}
                          </span>
                          <span className="resource-file-meta">
                            {meta.size && <span>{meta.size}</span>}
                            {att.sender_username && <span> • {att.sender_username}</span>}
                          </span>
                        </div>
                        <a
                          href={meta.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="resource-file-download"
                          title="Tải về"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Lightbox Preview Modal */}
      {previewItem &&
        createPortal(
          <div className="resource-lightbox-overlay" onClick={() => setPreviewItem(null)}>
            <div className="resource-lightbox-card" onClick={(e) => e.stopPropagation()}>
              <div className="resource-lightbox-header">
                <span className="resource-lightbox-title">
                  {previewItem.file_name || "Xem trước"}
                </span>
                <button
                  className="resource-lightbox-close"
                  onClick={() => setPreviewItem(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="resource-lightbox-body">
                {getFileMeta(previewItem).type === "video" ? (
                  <video src={previewItem.file_url} controls autoPlay />
                ) : (
                  <img src={previewItem.file_url} alt={previewItem.file_name} />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

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
