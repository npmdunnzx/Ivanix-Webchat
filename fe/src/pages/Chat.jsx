import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { Users, Search, Info, MessageSquarePlus } from "lucide-react";
import { motion } from "motion/react";
import { SocketContext } from "../context/SocketContext.jsx";
import "../assets/styles/chat.css";
import convService from "../services/conversation.service.js";
import messService from "../services/message.service.js";
import ChatInfo from "../components/ChatInfo.jsx";
import CreateGroupModal from "../components/CreateGroupModal.jsx";
import FileAttachment from "../components/FileAttachment.jsx";
import MessageAttachments from "../components/MessageAttachments.jsx";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import "dayjs/locale/vi.js";
import debounce from "lodash.debounce";

dayjs.extend(relativeTime);
dayjs.locale("vi");

function Chat() {
  const { userInfo } = useContext(AuthContext);
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const latestSearchId = useRef(0);
  const searchRef = useRef(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const messagesRef = useRef(null);
  const { socket, onlineUsers, isUserOnline } = useContext(SocketContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState([]);   // File[]

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const convs = await convService.getAllConversations();
        setConversations(convs.data.result);
      } catch (error) {
        console.error("Could not fetch conversations:" + error.message);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversations.length === 0) return;

    if (conversationId) {
      const targetConv = conversations.find((c) => c.id === conversationId);
      if (targetConv) {
        setSelectedConversation(targetConv);
      } else {
        navigate("/chat", { replace: true });
      }
    }
  }, [conversationId, conversations, navigate]);

  const handleGroupCreated = (newConv) => {
    if (!newConv) return;
    if (socket && newConv.id) {
      socket.emit("conversation:join", newConv.id);
    }
    setConversations((prev) => [
      newConv,
      ...prev.filter((c) => c.id !== newConv.id),
    ]);
    setSelectedConversation(newConv);
  };

  // Join and leave conversation rooms
  useEffect(() => {
    if (!conversations.length) return;

    conversations.forEach((conv) => {
      socket.emit("conversation:join", conv.id);
    });

    return () => {
      conversations.forEach((conv) => {
        socket.emit("conversation:leave", conv.id);
      });
    };
  }, [socket, conversations.length]);

  // Fetch messages
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const fetchMessages = async () => {
      const msgs = await messService.getMessages(selectedConversation.id);
      setMessages(msgs.data.reverse() || []);
    };

    fetchMessages();
  }, [selectedConversation?.id, messagesRefreshKey]);

  // Handle clear history
  const handleHistoryCleared = (convId) => {
    if (selectedConversation?.id === convId) {
      setMessages([]);
      setMessagesRefreshKey(k => k + 1);
    }
  };

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      // 1. Chỉ cập nhật khung chat nếu tin nhắn thuộc conversation đang mở
      if (msg.conversation_id === selectedConversation?.id) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (m) => m.client_offset && m.client_offset === msg.client_offset,
          );
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = { ...msg, isUploading: false };
            return updated;
          }
          return [...prev, msg];
        });
      }

      // 2. Luôn cập nhật Sidebar cho TẤT CẢ hội thoại
      setConversations((prevConvs) => {
        const updatedConvs = prevConvs.map((conv) =>
          conv.id === msg.conversation_id
            ? {
              ...conv,
              last_message_content: msg.content || (msg.attachments?.length ? "[File/Hình ảnh]" : ""),
              last_message_at: msg.created_at,
              last_message_sender_id: msg.sender_id,
              unread_count:
                msg.conversation_id === selectedConversation?.id ||
                  msg.sender_id === userInfo?.id
                  ? 0
                  : (conv.unread_count || 0) + 1,
            }
            : conv,
        );
        return updatedConvs.sort(
          (a, b) =>
            new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0),
        );
      });
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, selectedConversation?.id, userInfo]);

  useEffect(() => {
  const handleNewConversation = async ({ conversationId }) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conversationId)) return prev; // đã có rồi
      // Fetch conversation mới và thêm vào
      convService.getAllConversations().then((res) => {
        if (res.success && res.data?.result) {
          const newConv = res.data.result.find((c) => c.id === conversationId);
          if (newConv) {
            socket.emit("conversation:join", newConv.id);
            setConversations((latest) =>
              latest.some((c) => c.id === newConv.id)
                ? latest
                : [newConv, ...latest]
            );
          }
        }
      });
      return prev;
    });
  };

  socket.on("conversation:new", handleNewConversation);
  return () => socket.off("conversation:new", handleNewConversation);
}, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setConversations((prevConvs) =>
      prevConvs.map((c) =>
        conv.id === c.id ? { ...conv, unread_count: 0 } : c,
      ),
    );
    navigate(`/chat/${conv.type}/${conv.id}`);
  };

  useEffect(() => {
    searchRef.current = debounce(async (keyword) => {
      const requestId = ++latestSearchId.current;
      try {
        const result = keyword.trim()
          ? await convService.searchConversation(keyword)
          : await convService.getAllConversations();

        if (requestId !== latestSearchId.current) return;
        // console.log("Search result:", result.data.result);
        setConversations(result.data.result);
      } catch (error) {
        console.error("Error searching conversations:" + error.message);
      }
    }, 1000);

    return () => searchRef.current.cancel();
  }, []);

  // Gọi hàm debounce mỗi khi searchKeyword đổi
  useEffect(() => {
    searchRef.current?.(searchKeyword);
  }, [searchKeyword]);

  const handleInputChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const handleGroupRenamed = (convId, newName) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, name: newName } : c))
    );
    setSelectedConversation((prev) =>
      prev && prev.id === convId ? { ...prev, name: newName } : prev
    );
  };

  const handleConversationRemoved = (convId) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== convId);
      if (selectedConversation?.id === convId) {
        setSelectedConversation(updated[0] || null);
      }
      return updated;
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const filesToSend = [...attachedFiles];
    const textContent = input.trim();
    if (filesToSend.length === 0 && textContent === "") return;
    setInput("");
    setAttachedFiles([]);
    // --- Tin nhắn FILE (nếu có) ---
    if (filesToSend.length > 0) {
      const fileClientOffset = crypto.randomUUID();
      const tempAttachments = filesToSend.map((file, idx) => ({
        id: `temp-${fileClientOffset}-${idx}`,
        file_url: URL.createObjectURL(file),
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        display_order: idx,
      }));
      const optimisticFileMsg = {
        client_offset: fileClientOffset,
        sender_id: userInfo.id,
        conversation_id: selectedConversation.id,
        content: null,
        attachments: tempAttachments,
        isUploading: true,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticFileMsg]);
      try {
        await messService.uploadFilesMessage(
          fileClientOffset,
          selectedConversation.id,
          filesToSend,
        );
        tempAttachments.forEach((att) => URL.revokeObjectURL(att.file_url));
      } catch (error) {
        console.error("Gửi file thất bại: " + error.message);
        setMessages((prev) =>
          prev.map((m) =>
            m.client_offset === fileClientOffset
              ? { ...m, isUploading: false, isError: true }
              : m,
          ),
        );
      }
    }
    // --- Tin nhắn TEXT (nếu có) ---
    if (textContent !== "") {
      const textClientOffset = crypto.randomUUID();
      const optimisticTextMsg = {
        client_offset: textClientOffset,
        sender_id: userInfo.id,
        conversation_id: selectedConversation.id,
        content: textContent,
        attachments: [],
        isUploading: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticTextMsg]);
      socket.emit("message:send", {
        conversationId: selectedConversation.id,
        content: textContent,
        clientOffset: textClientOffset,
        senderId: userInfo.id,
      });
    }
  };

  const selectedPartnerId = selectedConversation?.type === "private" ? selectedConversation?.partner_id : null;
  const isSelectedPartnerOnline = selectedPartnerId
    ? (isUserOnline ? isUserOnline(selectedPartnerId) : onlineUsers?.includes(String(selectedPartnerId)))
    : false;

  return (
    <div className="chat-page">
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 256, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="messages-panel"
      >
        <div className="messages-header">
          <div className="messages-title-row">
            <h2>Tin nhắn</h2>
            <button
              className="messages-add-button"
              onClick={() => setIsCreateGroupOpen(true)}
              title="Tạo nhóm mới"
            >
              <Users size={20} />
            </button>
            <button
              className="messages-add-button"
              onClick={() => navigate("/contacts")}
              title="Tìm bạn bè nhắn tin"
            >
              <MessageSquarePlus size={20} />
            </button>
          </div>
          <div className="messages-search">
            <Search size={16} />
            <input
              placeholder="Tìm tin nhắn..."
              value={searchKeyword}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="channel-list">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const isItemOnline = conv.type === "private" && conv.partner_id
                ? (isUserOnline ? isUserOnline(conv.partner_id) : onlineUsers?.includes(String(conv.partner_id)))
                : false;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`channel-item ${conv.id === selectedConversation?.id ? "active" : ""}`}
                >
                  <div className="channel-avatar">
                    {conv.partner_avatar ? (
                      <img
                        src={conv.partner_avatar}
                        alt={conv.partner_username}
                        className="partner-avatar"
                      />
                    ) : (
                      <Users size={18} />
                    )}
                    {conv.type === "private" && isItemOnline && (
                      <span className="online-dot online" style={{ position: "absolute", bottom: 0, right: 0 }} />
                    )}
                    {conv.unread_count > 0 && (
                      <span className="unread-dot">{conv.unread_count}</span>
                    )}
                  </div>
                  <div className="channel-content">
                    <div className="channel-heading">
                      <p className={`${conv.unread_count > 0 ? "unread" : ""}`}>
                        {conv.name || conv.partner_username}
                      </p>
                      <span>{dayjs(conv.last_message_at ?? conv.created_at).fromNow()}</span>
                    </div>
                    <p
                      className={`channel-description ${conv.unread_count > 0 ? "unread" : ""}`}
                    >
                      {conv.last_message_content}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="no-conversations">Không có cuộc trò chuyện nào</p>
          )}
        </div>
      </motion.aside>
      {selectedConversation ? (
        <div className="chat-container">
          <div className="chat-header">
            {selectedConversation?.partner_avatar ? (
              <img
                src={selectedConversation.partner_avatar}
                alt={selectedConversation.partner_username}
                className="avatar-info"
              />
            ) : (
              <Users className="avatar-info" />
            )}
            <div className="chat-header-title">
              <h2>
                {selectedConversation?.name ||
                  selectedConversation?.partner_username}
              </h2>
              {selectedConversation?.type === "private" && (
                <div className="chat-header-status-row">
                  <span className={`online-dot ${isSelectedPartnerOnline ? "online" : "offline"}`} />
                  <span className="chat-header-status-text">
                    {isSelectedPartnerOnline
                      ? "Đang hoạt động"
                      : selectedConversation?.partner_last_seen
                        ? `Hoạt động ${dayjs(selectedConversation.partner_last_seen).fromNow()}`
                        : "Ngoại tuyến"}
                  </span>
                </div>
              )}
            </div>
            <button
              className="chat-info-button"
              onClick={() => setIsChatInfoOpen(!isChatInfoOpen)}
            >
              <Info size={20} />
            </button>
          </div>
          <div className="chat-content">
            <ul id="messages" ref={messagesRef}>
              {messages.map((msg, index) => {
                const isMine = msg.sender_id === userInfo?.id;
                const hasText = Boolean(msg.content && msg.content.trim());
                const hasAttachments = msg.attachments && msg.attachments.length > 0;

                // Xác định nhóm liên tiếp
                const prevMsg = messages[index - 1];
                const nextMsg = messages[index + 1];
                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                return (
                  <li
                    key={msg.server_offset || msg.client_offset || index}
                    className={[
                      "msg-row",
                      isMine ? "mine" : "other",
                      isFirstInGroup ? "first-in-group" : "cont-in-group",
                      isLastInGroup ? "last-in-group" : "",
                    ].join(" ")}
                  >
                    {/* Cột trái: Avatar (chỉ với tin người khác) */}
                    {!isMine && (
                      <div className="msg-avatar-col">
                        {isFirstInGroup ? (
                          msg.sender_avt ? (
                            <img
                              src={msg.sender_avt}
                              alt={msg.sender_username}
                              className="msg-sender-avatar"
                            />
                          ) : (
                            <div className="msg-sender-avatar msg-sender-avatar-fallback">
                              <Users size={16} />
                            </div>
                          )
                        ) : (
                          <div className="msg-avatar-spacer" />
                        )}
                      </div>
                    )}

                    {/* Cột phải: Tên + Bubbles */}
                    <div className="msg-body-col">
                      {/* Tên người gửi — chỉ hiện ở tin đầu nhóm */}
                      {!isMine && isFirstInGroup && (
                        <span className="msg-sender-name">{msg.sender_username}</span>
                      )}

                      {/* Bong bóng văn bản */}
                      {hasText && (
                        <div className="msg-text-bubble">
                          <p>{msg.content}</p>
                        </div>
                      )}

                      {/* Đính kèm */}
                      {hasAttachments && (
                        <MessageAttachments attachments={msg.attachments} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>


            <form id="form" onSubmit={handleSubmit}>
              {/* Preview grid — hiện phía trên khi có file */}
              {attachedFiles.length > 0 && (
                <FileAttachment
                  files={attachedFiles}
                  onChange={setAttachedFiles}
                  previewOnly
                />
              )}
              <div className="form-row">
                {/* Trigger button nằm trong hàng cùng input */}
                <FileAttachment
                  files={attachedFiles}
                  onChange={setAttachedFiles}
                  triggerOnly
                />
                <input
                  id="input"
                  autoComplete="off"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhắn tin..."
                />
                <button type="submit">Send</button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="chat-container chat-container--empty">
          <div className="empty-state">
            {/* Blobs nền */}
            <div className="empty-blob empty-blob--1" />
            <div className="empty-blob empty-blob--2" />
            <div className="empty-blob empty-blob--3" />

            {/* Illustration bong bóng chat */}
            <div className="empty-illustration">
              <div className="bubble-stack">
                <div className="bubble bubble--a">
                  <span>Xin chào! 👋</span>
                </div>
                <div className="bubble bubble--b">
                  <span>Hôm nay bạn thế nào?</span>
                </div>
              </div>
              <div className="empty-avatar-ring">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="38" stroke="url(#ringGrad)" strokeWidth="2" strokeDasharray="6 4" />
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="empty-avatar-icon">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                    <circle cx="20" cy="14" r="7" fill="url(#avatarGrad)" />
                    <ellipse cx="20" cy="30" rx="12" ry="7" fill="url(#avatarGrad)" opacity="0.7" />
                    <defs>
                      <linearGradient id="avatarGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366f1" />
                        <stop offset="1" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="empty-text">
              <h2 className="empty-title">Ivanix</h2>
              <p className="empty-subtitle">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
            </div>

            {/* Dots trang trí */}
            <div className="empty-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}
      {selectedConversation && (
        <ChatInfo
          conversation={selectedConversation}
          isOpen={isChatInfoOpen}
          onConversationRemoved={handleConversationRemoved}
          onGroupRenamed={handleGroupRenamed}
          onHistoryCleared={handleHistoryCleared}
        />)}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

    </div>
  );
}

export default Chat;

