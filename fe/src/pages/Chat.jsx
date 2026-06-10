import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import {socket} from "../services/socket.js";
import { SocketContext } from "../context/SocketContext.jsx";
import LayoutPage from "../components/LayoutPage.jsx";
import "../assets/styles/chat.css";
import { useNavigate } from "react-router-dom";

function Chat() {
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const counterRef = useRef(0);
  const messagesRef = useRef(null);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat message");
    };
  }, [socket]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    socket.emit("chat message", input);
    setInput("");
  };

  return (
    <div className="chat-page">
      <LayoutPage />

      <div className="chat-container">
        <ul id="messages" ref={messagesRef}>
          {messages.map((msg, index) => (
            <li
              key={msg.serverOffset || index}
              className={msg.mine ? "mine" : "other"}
            >
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
