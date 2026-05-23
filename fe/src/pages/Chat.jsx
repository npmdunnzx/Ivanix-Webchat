import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import LayoutPage from "../components/LayoutPage.jsx";
import "../assets/styles/chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const counterRef = useRef(0);
  const messagesRef = useRef(null);

  const username = useMemo(() => {
    const savedUsername = localStorage.getItem("username");
    return savedUsername || prompt("Nhap ten cua ban:") || "Anonymous";
  }, []);

  const roomName = useMemo(() => {
    return new URLSearchParams(window.location.search).get("room") || "general";
  }, []);

  const serverOffsetKey = useMemo(() => {
    return `serverOffset:${roomName}`;
  }, [roomName]);

  const socket = useMemo(() => {
    return io("http://localhost:4000", {
      auth: {
        serverOffset: Number(localStorage.getItem(serverOffsetKey) || 0),
        username,
        roomName,
      },
      ackTimeout: 10000,
      retries: 3,
    });
  }, [roomName, serverOffsetKey, username]);

  useEffect(() => {
    localStorage.setItem("username", username);

    const handleConnect = () => {
      socket.emit("join room", roomName);
    };

    const handleMessage = (msg, senderName, serverOffset) => {
      setMessages((prev) => {
        if (prev.some((message) => message.serverOffset === serverOffset)) {
          return prev;
        }

        return [
          ...prev,
          {
            serverOffset,
            text: msg,
            user: senderName,
            mine: senderName === username,
          },
        ];
      });

      if (serverOffset) {
        socket.auth.serverOffset = serverOffset;
        localStorage.setItem(serverOffsetKey, String(serverOffset));
      }
    };

    socket.on("connect", handleConnect);
    socket.on("chat message", handleMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("chat message", handleMessage);
      socket.disconnect();
    };
  }, [roomName, serverOffsetKey, socket, username]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const text = input.trim();
    if (!text || !socket.connected) return;

    const clientOffset = `${socket.id}-${counterRef.current++}`;

    socket.emit("chat message", text, roomName, clientOffset, (serverOffset) => {
      console.log("message acknowledged:", serverOffset);
    });

    setInput("");
  };

  return (
    <div className="chat-page">
      <LayoutPage />

      <div className="chat-container">
        <ul id="messages" ref={messagesRef}>
          {messages.map((msg, index) => (
            <li key={msg.serverOffset || index} className={msg.mine ? "mine" : "other"}>
              {msg.text}
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
  );
}

export default Chat;
