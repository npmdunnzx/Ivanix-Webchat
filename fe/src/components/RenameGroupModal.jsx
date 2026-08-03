import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Edit3, X, Loader2 } from "lucide-react";
import convService from "../services/conversation.service.js";
import { notifyError, notifySuccess } from "../utils/toast.js";
import "../assets/styles/CreateGroupModal.css";

function RenameGroupModal({ isOpen, onClose, conversationId, currentName = "", onGroupRenamed }) {
  const [groupName, setGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGroupName(currentName || "");
    }
  }, [isOpen, currentName]);

  const handleRename = async (e) => {
    e.preventDefault();

    const trimmed = groupName.trim();
    if (!trimmed) {
      notifyError("Vui lòng nhập tên nhóm mới!");
      return;
    }

    if (trimmed === currentName) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await convService.renameGroup(conversationId, trimmed);
      if (res.success) {
        notifySuccess("Đổi tên nhóm thành công!");
        if (onGroupRenamed) {
          onGroupRenamed(trimmed);
        }
        onClose();
      } else {
        const msg = res.listErr?.[0]?.msg || "Không thể đổi tên nhóm!";
        notifyError(msg);
      }
    } catch (err) {
      console.error("Lỗi khi đổi tên nhóm:", err);
      notifyError("Có lỗi xảy ra khi đổi tên nhóm!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="create-group-backdrop" onClick={onClose}>
        <motion.div
          className="create-group-modal"
          style={{ maxWidth: "380px" }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="create-group-header">
            <div className="create-group-title">
              <Edit3 size={20} className="title-icon" />
              <h3>Đổi tên nhóm</h3>
            </div>
            <button className="create-group-close-btn" onClick={onClose} disabled={isSubmitting}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleRename} className="create-group-body">
            <div className="form-group">
              <label htmlFor="renameInput">Tên nhóm mới</label>
              <input
                id="renameInput"
                type="text"
                className="group-input"
                placeholder="Nhập tên nhóm mới..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                autoFocus
              />
            </div>

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
                disabled={isSubmitting || !groupName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default RenameGroupModal;
