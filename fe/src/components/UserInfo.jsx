import {User} from "lucide-react";
import "../assets/styles/userinfo.css";
function UserInfo(props) {
    const { userInfo } = props;
    return (
        <button className="user-info">
            <div className="user-avatar">
                {userInfo?.avatar ? (
                    <img src={userInfo.avatar} alt="User's avatar" />
                ) : (
                    <User size={24} />
                )}
            </div>
            <div className="user-details">
                <p className="user-name fw-bold">{userInfo?.username || "Unknown User"}</p>
                <p className="user-role">{userInfo?.role || "Member"}</p>
            </div>
            {/* <div className="connect-button">
                <button className="btn btn-primary">Kết nối</button>
            </div> */}
        </button>
    );
}

export default UserInfo;