import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { Plus, Users, Search, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SocketContext } from "../context/SocketContext.jsx";
import "../assets/styles/chat.css";
import convService from "../services/conversation.service.js";
import messService from "../services/message.service.js";
import ChatInfo from "../components/ChatInfo.jsx";
// import { useNavigate } from "react-router-dom";
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
  // const navigate = useNavigate();
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
      // console.log("msgs:", msgs);
      setMessages(msgs.data.reverse() || []);
    };

    fetchMessages();
  }, [selectedConversation?.id]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      setMessages((prev) =>
        msg.conversation_id === selectedConversation?.id
          ? [...prev, msg]
          : prev,
      );

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    socket.emit("message:send", {
      conversationId: selectedConversation.id,
      content: input,
      clientOffset: crypto.randomUUID(),
      senderId: userInfo.id,
    });
    setInput("");
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
            <button className="messages-add-button">
              <Plus size={20} />
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
                    <span>{dayjs(conv.last_message_at).fromNow()}</span>
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
            {messages.map((msg, index) => (
              <li
                key={msg.server_offset || msg.client_offset || index}
                className={msg.sender_id === userInfo.id ? "mine" : "other"}
              >
                {msg.content}
              </li>
            ))}
          </ul>

          <form id="form" onSubmit={handleSubmit}>
            <input
              id="input"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
      <ChatInfo conversation={selectedConversation} isOpen={isChatInfoOpen} />
    </div>
  );
}

export default Chat;
