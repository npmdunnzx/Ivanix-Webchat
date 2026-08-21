import React from "react";
import { MessageSquare, Users, RefreshCw } from "lucide-react";
import "../assets/styles/loading_screen.css";

export default function AuthLoadingScreen() {
  return (
    <div className="auth-loading-container">
      {/* Background Radial Glow */}
      <div className="auth-loading-bg-glow" />

      {/* Header Bar */}
      <header className="auth-loading-header">
        <span className="auth-loading-header-title">Ivanix Webchat</span>
      </header>

      {/* Main Content Area */}
      <main className="auth-loading-content">
        {/* Glow Logo Box */}
        <div className="auth-loading-logo-wrapper">
          <div className="auth-loading-logo-box">
            <MessageSquare size={34} strokeWidth={2} />
          </div>
        </div>

        {/* Branding */}
        <div className="auth-loading-branding-wrap">
          <div className="auth-loading-branding">
            <h1 className="auth-loading-app-name">IVANIX</h1>
            <span className="auth-loading-badge">WEBCHAT</span>
          </div>
          <p className="auth-loading-subtitle">
            Nền tảng giao tiếp & làm việc nhóm hiện đại
          </p>
        </div>

        {/* Glassmorphism Loading Card */}
        <div className="auth-loading-card">
          <div className="auth-loading-step-text">
            <Users size={18} className="text-emerald-400" />
            <span>Đồng bộ hóa danh bạ & tin nhắn...</span>
          </div>

          {/* Continuous Indeterminate Progress Bar */}
          <div className="auth-loading-progress-track">
            <div className="auth-loading-progress-bar-pulse" />
          </div>

          {/* Footer Info inside Card */}
          <div className="auth-loading-card-footer">
            <div className="auth-loading-indicator">
              <span className="auth-loading-dot" />
              <span>Context Loading</span>
            </div>
            <span className="auth-loading-percentage">Đang tải...</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="auth-loading-bottom">
        <RefreshCw size={14} className="animate-spin text-slate-500" />
        <span>Đang khởi tạo ứng dụng...</span>
      </footer>
    </div>
  );
}
