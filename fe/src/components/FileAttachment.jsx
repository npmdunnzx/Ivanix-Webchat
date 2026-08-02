import { useRef, useState } from "react";
import { Paperclip, FileText, X } from "lucide-react";
import "../assets/styles/fileattachment.css";

const MAX_FILES = 5;
const ACCEPTED_TYPES = "image/*,.pdf,.doc,.docx,.xls,.xlsx";

/**
 * FileAttachment — quản lý chọn nhiều file (tối đa MAX_FILES = 5).
 *
 * Props:
 *   files       : File[]                — danh sách file hiện tại (controlled)
 *   onChange    : (files: File[]) => void
 *   previewOnly : boolean               — chỉ render preview grid (không render trigger)
 *   triggerOnly : boolean               — chỉ render nút trigger (không render preview)
 *
 * Dùng trong Chat.jsx:
 *   <FileAttachment files={...} onChange={...} previewOnly />   ← phía trên form-row
 *   <FileAttachment files={...} onChange={...} triggerOnly />   ← bên trong form-row
 */
function FileAttachment({ files = [], onChange, previewOnly = false, triggerOnly = false }) {
  const inputRef = useRef(null);

  // Map<File, string> — lưu blob URL cho ảnh, tránh tạo lại mỗi render
  const [previewUrls] = useState(() => new Map());

  const getPreview = (file) => {
    if (!file.type.startsWith("image/")) return null;
    if (!previewUrls.has(file)) {
      previewUrls.set(file, URL.createObjectURL(file));
    }
    return previewUrls.get(file);
  };

  const revokeFiles = (filesToRevoke) => {
    filesToRevoke.forEach((f) => {
      const url = previewUrls.get(f);
      if (url) {
        URL.revokeObjectURL(url);
        previewUrls.delete(f);
      }
    });
  };

  const handleInputChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;

    const merged = [...files];
    for (const f of incoming) {
      if (merged.length >= MAX_FILES) break;
      const isDup = merged.some((m) => m.name === f.name && m.size === f.size);
      if (!isDup) merged.push(f);
    }

    onChange(merged);
    // Reset để có thể chọn lại cùng file
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index) => {
    revokeFiles([files[index]]);
    onChange(files.filter((_, i) => i !== index));
  };

  const canAddMore = files.length < MAX_FILES;

  // ── Render preview grid ─────────────────────────────────
  if (previewOnly) {
    return (
      <div className="fa-preview-grid">
        {files.map((file, idx) => {
          const preview = getPreview(file);
          return (
            <div key={`${file.name}-${idx}`} className="fa-item">
              {preview ? (
                <img src={preview} alt={file.name} className="fa-item-img" />
              ) : (
                <div className="fa-item-file">
                  <FileText size={18} />
                  <span className="fa-item-name">{file.name}</span>
                </div>
              )}
              <button
                type="button"
                className="fa-item-remove"
                onClick={() => handleRemove(idx)}
                title="Xóa"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        <span className="fa-counter">{files.length}/{MAX_FILES}</span>
      </div>
    );
  }

  // ── Render chỉ nút trigger ─────────────────────────────
  if (triggerOnly) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          id="fileAttachmentInput"
          className="fa-hidden-input"
          multiple
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          disabled={!canAddMore}
        />
        <label
          htmlFor="fileAttachmentInput"
          className={`attachment-button${!canAddMore ? " attachment-button--disabled" : ""}`}
          title={canAddMore ? `Đính kèm file (tối đa ${MAX_FILES})` : `Đã đạt giới hạn ${MAX_FILES} file`}
        >
          <Paperclip size={20} />
        </label>
      </>
    );
  }

  // ── Default: render cả hai (fallback) ─────────────────
  return (
    <div className="file-attachment-full">
      {files.length > 0 && (
        <div className="fa-preview-grid">
          {files.map((file, idx) => {
            const preview = getPreview(file);
            return (
              <div key={`${file.name}-${idx}`} className="fa-item">
                {preview ? (
                  <img src={preview} alt={file.name} className="fa-item-img" />
                ) : (
                  <div className="fa-item-file">
                    <FileText size={18} />
                    <span className="fa-item-name">{file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="fa-item-remove"
                  onClick={() => handleRemove(idx)}
                  title="Xóa"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
          <span className="fa-counter">{files.length}/{MAX_FILES}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        id="fileAttachmentInput"
        className="fa-hidden-input"
        multiple
        accept={ACCEPTED_TYPES}
        onChange={handleInputChange}
        disabled={!canAddMore}
      />
      <label
        htmlFor="fileAttachmentInput"
        className={`attachment-button${!canAddMore ? " attachment-button--disabled" : ""}`}
        title={canAddMore ? `Đính kèm file (tối đa ${MAX_FILES})` : `Đã đạt giới hạn ${MAX_FILES} file`}
      >
        <Paperclip size={20} />
      </label>
    </div>
  );
}

export default FileAttachment;
