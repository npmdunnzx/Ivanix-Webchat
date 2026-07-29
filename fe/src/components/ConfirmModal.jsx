import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import "../assets/styles/ConfirmModal.css";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDanger = true,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="confirm-modal-backdrop" onClick={onClose}>
        <motion.div
          className="confirm-modal-card"
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: "spring", duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="confirm-modal-header">
            <div className={`confirm-icon-wrapper ${isDanger ? "danger" : ""}`}>
              <AlertTriangle size={24} />
            </div>
            <button className="confirm-close-btn" onClick={onClose} disabled={isLoading}>
              <X size={18} />
            </button>
          </div>

          <div className="confirm-modal-body">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>

          <div className="confirm-modal-footer">
            <button
              type="button"
              className="confirm-btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`confirm-btn-action ${isDanger ? "danger" : "primary"}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ConfirmModal;
