import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileAudio,
  FileVideo,
  File,
  Image as ImageIcon,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Loader2
} from "lucide-react";
import "../assets/styles/messageattachments.css";

function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileInfo(att) {
  const url = att.file_url || att.url || "";
  const fileName = att.file_name || att.name || url.split("/").pop() || "File";
  const mimeType = (att.mime_type || att.type || "").toLowerCase();
  const extParts = fileName.split(".");
  const ext = extParts.length > 1 ? extParts.pop().toLowerCase() : "";

  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return { category: "image", ext: ext.toUpperCase() || "IMG", fileName, url, size: formatFileSize(att.file_size || att.size), icon: ImageIcon, accentColor: "#3b82f6", accentBg: "rgba(59, 130, 246, 0.12)" };
  }
  if (mimeType.startsWith("video/") || ["mp4", "mov", "avi", "mkv"].includes(ext)) {
    return { category: "video", ext: ext.toUpperCase() || "VID", fileName, url, size: formatFileSize(att.file_size || att.size), icon: FileVideo, accentColor: "#f97316", accentBg: "rgba(249, 115, 22, 0.12)" };
  }
  if (mimeType === "application/pdf" || ext === "pdf") {
    return { category: "pdf", ext: "PDF", fileName, url, size: formatFileSize(att.file_size || att.size), icon: FileText, accentColor: "#ef4444", accentBg: "rgba(239, 68, 68, 0.12)" };
  }
  if (mimeType.includes("word") || ["doc", "docx"].includes(ext)) {
    return { category: "word", ext: ext.toUpperCase() || "DOCX", fileName, url, size: formatFileSize(att.file_size || att.size), icon: FileText, accentColor: "#2563eb", accentBg: "rgba(37, 99, 235, 0.12)" };
  }
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || ["xls", "xlsx", "csv"].includes(ext)) {
    return { category: "excel", ext: ext.toUpperCase() || "XLSX", fileName, url, size: formatFileSize(att.file_size || att.size), icon: FileSpreadsheet, accentColor: "#10b981", accentBg: "rgba(16, 185, 129, 0.12)" };
  }
  return { category: "other", ext: ext ? ext.toUpperCase() : "FILE", fileName, url, size: formatFileSize(att.file_size || att.size), icon: File, accentColor: "#64748b", accentBg: "rgba(100, 116, 139, 0.12)" };
}

function MessageAttachments({ attachments = [], isUploading = false }) {
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  if (!attachments || attachments.length === 0) return null;

  const displayAttachments = attachments.slice(0, 5);
  const mediaItems = [];
  const docItems = [];

  displayAttachments.forEach((att, index) => {
    const info = getFileInfo(att);
    if (info.category === "image") mediaItems.push({ att, info, originalIndex: index });
    else docItems.push({ att, info, originalIndex: index });
  });

  return (
    <div className={`msg-attachments-container${isUploading ? " msg-attachments--uploading" : ""}`}>
      {/* Media Grid */}
      {mediaItems.length > 0 && (
        <div className={`msg-media-grid msg-media-grid--count-${Math.min(mediaItems.length, 5)}`}>
          {mediaItems.map((item, idx) => (
            <div
              key={idx}
              className="msg-media-item"
              onClick={() => !isUploading && setActiveImageIndex(idx)}
            >
              <img src={item.info.url} alt={item.info.fileName} className="msg-media-img" />
              {isUploading ? (
                <div className="msg-media-upload-spinner">
                  <Loader2 size={24} className="msg-spinner" />
                </div>
              ) : (
                <div className="msg-media-overlay">
                  <Maximize2 size={18} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Doc Cards */}
      {docItems.length > 0 && (
        <div className="msg-doc-list">
          {docItems.map((item, idx) => {
            const { info } = item;
            const IconComp = info.icon;
            return (
              <div key={idx} className={`msg-file-card${isUploading ? " msg-file-card--uploading" : ""}`}>
                <div className="msg-file-icon-wrapper" style={{ color: info.accentColor, backgroundColor: info.accentBg }}>
                  <IconComp size={22} />
                  <span className="msg-file-badge">{info.ext.slice(0, 4)}</span>
                </div>
                <div className="msg-file-details">
                  <span className="msg-file-name">{info.fileName}</span>
                  <div className="msg-file-meta">
                    <span className="msg-file-type-pill" style={{ color: info.accentColor }}>{info.ext}</span>
                    {info.size && <span className="msg-file-size">• {info.size}</span>}
                  </div>
                </div>
                {isUploading ? (
                  <div className="msg-file-uploading-spinner">
                    <Loader2 size={18} className="msg-spinner" />
                  </div>
                ) : (
                  <a href={info.url} download target="_blank" rel="noreferrer" className="msg-file-download-btn">
                    <Download size={17} />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {activeImageIndex !== null && mediaItems[activeImageIndex] && (
        <div className="msg-lightbox-overlay" onClick={() => setActiveImageIndex(null)}>
          <div className="msg-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="msg-lightbox-header">
              <span className="msg-lightbox-title">{mediaItems[activeImageIndex].info.fileName}</span>
              <button type="button" className="msg-lightbox-btn" onClick={() => setActiveImageIndex(null)}><X size={20} /></button>
            </div>
            <div className="msg-lightbox-body">
              <img src={mediaItems[activeImageIndex].info.url} alt="" className="msg-lightbox-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageAttachments;
