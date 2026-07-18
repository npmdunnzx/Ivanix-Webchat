import "../assets/styles/chatinfo.css";
import { Users, Info, BookOpen, ChevronDown, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import convService from "../services/conversation.service.js";
import UserInfo from "./UserInfo.jsx";

function ChatInfo(props) {
  const [members, setMembers] = useState([]);
  const [isMembersOpen, setIsMembersOpen] = useState(true);
  const conversationInfo = props.conversation;
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        const result = await convService.getGroupMembers(conversationInfo.id);
        setMembers(result.data.result);
      } catch (error) {
        console.log("Could not get group's member:" + error.message);
      }
    };
    fetchGroupMembers();
  }, [conversationInfo?.id]);

  return (
    <div className={`chat-info ${props.isOpen === true ? "" : "hidden"}`}>
      {conversationInfo && (
        <div className="detail-info-chat">
          {(conversationInfo.partner_avatar && (
            <img
              src={conversationInfo.partner_avatar}
              alt="User's avatar"
              className="avatar-info"
            />
          )) || <Users className="avatar-info" />}
          <p className="name-info">
            {conversationInfo.partner_username || conversationInfo.name}
          </p>
        </div>
      )}
      {conversationInfo?.name ? (
        <div className="member-info info-1">
          <div className="member-header">
            <p>
              <Info /> Thành viên ({members?.length})
            </p>
            <button
              onClick={() => setIsMembersOpen(!isMembersOpen)}
              className={`${isMembersOpen ? "open" : ""}`}
            >
              <ChevronDown />
            </button>
          </div>
          <div className={`member-list ${isMembersOpen ? "" : "hidden"}`}>
            <button className="btn btn-primary add-member">
              Thêm thành viên
            </button>
            {members?.map((member) => (
              <UserInfo key={member.id} userInfo={member} />
            ))}
          </div>
        </div>
      ) : (
        <div className="info-1">
          <p></p>
        </div>
      )}
      <div className="resource-info info-1">
        <p>
          <BookOpen /> Tài nguyên
        </p>
      </div>
      <div className="privacy-info info-1">
        <p>
          <ShieldAlert /> Quyền riêng tư
        </p>
        {conversationInfo?.name && (
          <button className="btn btn-danger leave-chat">
            Rời khỏi cuộc trò chuyện
          </button>
        )}
        <button className="btn btn-danger delete-chat">
          Xóa cuộc trò chuyện
        </button>
      </div>
    </div>
  );
}

export default ChatInfo;
