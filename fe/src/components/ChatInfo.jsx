import "../assets/styles/chatinfo.css";
import {Users} from "lucide-react";
function ChatInfo(props) {
    const conversationInfo = props.conversation;
    console.log("hhihi", conversationInfo);
    return <div className = {`chat-info ${props.isOpen === true ? "" :"hidden"}`}>
        {conversationInfo && <div className = "detail-info-chat">
            {(conversationInfo.partner_avatar && <img src={conversationInfo.partner_avatar} alt="User's avatar" className="avatar-info" />) || <Users className="avatar-info"/>}
            <p className="name-info">{conversationInfo.partner_username || conversationInfo.name }</p>
        </div>}
        {conversationInfo?.name && <div className="member-info">
            <p>hihi</p>
        </div>}
    </div>
}

export default ChatInfo;