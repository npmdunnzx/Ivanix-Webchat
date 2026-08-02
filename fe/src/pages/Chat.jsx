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

function findZeroUnreadConversation(conversations) {
  return conversations.find((conv) => conv.unread_count === 0);
}

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
  const { socket } = useContext(SocketContext);
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
        setSelectedConversation(
          findZeroUnreadConversation(convs.data.result) || convs.data.result[0],
        );
        // console.log("data:", convs.data);
        console.log(
          "conversations:",
          findZeroUnreadConversation(convs.data.result),
        );
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
  } else {
    const defaultConv = findZeroUnreadConversation(conversations) || conversations[0];
    if (defaultConv) {
      setSelectedConversation(defaultConv);
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
      if (msg.conversation_id !== selectedConversation?.id) return;
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
      setConversations((prevConvs) => {
        const updatedConvs = prevConvs.map((conv) =>
          conv.id === msg.conversation_id
            ? {
                ...conv,
                last_message_content: msg.content,
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
            <button className="messages-add-button">
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
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`channel-item ${conv.id === selectedConversation?.id ? "active" : ""}`}
              >
                <div className="channel-avatar">
                  <Users size={18} />
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
            ))
          ) : (
            <p className="no-conversations">Không có cuộc trò chuyện nào</p>
          )}
        </div>
      </motion.aside>
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
          <h2>
            {selectedConversation?.name ||
              selectedConversation?.partner_username}
          </h2>
          <span className="online-dot"></span>
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

              return (
                <li
                  key={msg.server_offset || msg.client_offset || index}
                  className={`msg-row ${isMine ? "mine" : "other"}`}
                >
                  {/* Bong bóng văn bản (chỉ render khi có chữ) */}
                  {hasText && (
                    <div className="msg-text-bubble">
                      <p>{msg.content}</p>
                    </div>
                  )}

                  {/* Hiển thị đính kèm — Độc lập, không bị bao bởi màu bubble mine/other */}
                  {hasAttachments && (
                    <MessageAttachments attachments={msg.attachments} />
                  )}
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
      <ChatInfo 
        conversation={selectedConversation} 
        isOpen={isChatInfoOpen} 
        onConversationRemoved={handleConversationRemoved}
        onGroupRenamed={handleGroupRenamed}
        onHistoryCleared={handleHistoryCleared}
      />
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}

export default Chat;
