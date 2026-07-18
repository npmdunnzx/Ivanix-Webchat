# Web Chat Realtime

Web Chat Realtime is a full-stack chat application built with React, Express, Socket.IO, and PostgreSQL. The current backend focuses on authentication, user profile/search, and realtime online-user presence.

## Current Backend Scope

Implemented in the backend now:

- Authentication: signup, login
- User profile: get current profile
- User search
- Socket.IO connection with cookie-based JWT authentication
- Realtime online-user tracking

Planned in the SRS but not yet implemented in the backend:

- Conversations
- Messages
- Upload image/file
- Typing indicator
- Seen message
- Notifications
- Sidebar conversation ranking and unread count persistence

## Base URLs

- Backend API: `http://localhost:4000/api`
- Socket.IO server: `http://localhost:4000`

## Authentication

Authentication uses an httpOnly cookie named `jwt`.
The frontend should send requests with credentials enabled.

### `POST /api/auth/signup`

Create a new user account.

Request body:

```json
{
  "username": "manhdung",
  "email": "manh@example.com",
  "password": "Password123"
}
```

Response:

```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "username": "manhdung",
    "email": "manh@example.com"
  }
}
```

Notes:

- Backend sets the `jwt` cookie on success.
- The cookie is `httpOnly`.

### `POST /api/auth/login`

Login with email and password.

Request body:

```json
{
  "email": "manh@example.com",
  "password": "Password123",
  "rememberMe": false
}
```

Response:

```json
{
  "message": "Login successfully",
  "user": {
    "id": "...",
    "username": "manhdung",
    "email": "manh@example.com"
  }
}
```

Notes:

- Backend sets the `jwt` cookie on success.
- `rememberMe` extends the cookie lifetime.

### `POST /api/auth/logout`

Logout is implemented in the controller, but the route is not mounted in the current server config.

## Users

### `GET /api/user/me`

Get the currently authenticated user profile.

Protected by cookie-based JWT auth.

Response:

```json
{
  "id": "...",
  "username": "manhdung",
  "email": "manh@example.com",
  "avatar_url": "..."
}
```

### `GET /api/user/search?id=user_id&keyword=manh`

Search users by keyword.

Query params:

- `id`: the current user's id
- `keyword`: search keyword

Response:

```json
[
  {
    "id": "...",
    "username": "manhdung",
    "avatar_url": "..."
  }
]
```

## Socket.IO

Socket authentication also uses the `jwt` cookie.
The frontend should connect with credentials enabled.

Events currently emitted by the backend:

- `getOnlineUsers`

Behavior:

- On connect, the backend adds the user to the in-memory online-user map.
- On disconnect, the backend removes the socket from the map.
- The server broadcasts the current online user list through `getOnlineUsers`.

Example client setup:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  withCredentials: true,
});
```

## Database

The current schema includes:

- `users`
- `conversations`
- `conversation_members`
- `messages`
- `message_seen`

The schema is defined in [`be/chat.sql`](be/chat.sql).

## SRS Alignment

The detailed requirements document is in [`SRS_Webchat_realtime.txt`](SRS_Webchat_realtime.txt).
It contains:

- implemented backend scope
- planned chat features
- database design
- Socket.IO design
- security notes
- UI/UX guidance

## Frontend Integration Notes

Use `withCredentials: true` in Axios so the browser sends the httpOnly cookie automatically.

Example:

```js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});
```
## chat

### `GET /api/conversations`

Query params:

- `userId`

Response:

``` json 
{
  "id": "...",
  "type": "private",
  "name": null,
  "last_message_at": "...",
  "last_message_sender_id": "...",
  "last_message_id": "...",
  "unread_count": 3,
  "last_message_content": "hello",
  "last_message_type": "text",
  "partner_id": "...",
  "partner_username": "manh",
  "partner_avatar": "..."
}
```


### `POST /api/conversations/start`



- `POST /api/conversations/group`
- `GET /api/messages/:conversationId`
- `POST /api/messages`
- `DELETE /api/messages/:id`
- `POST /api/upload/image`
- `POST /api/upload/file`

## Summary

Current project status:

- Auth is cookie-based with JWT.
- User profile and search are implemented.
- Realtime online-user tracking is implemented.
- Conversation/message/upload features are documented in the SRS and can be added next.


## 🛠️ Setup Redis (Dành riêng cho Git Bash trên Windows)

Chạy các khối lệnh dưới đây trực tiếp vào Terminal Git Bash của bạn để quản lý Redis thông qua Docker.

### 1. Khởi tạo và chạy lần đầu tiên

```bash
# Khởi động dịch vụ Docker Engine chạy ẩn dưới nền (Không mở UI)
# cmd.exe /c "start /B "" "C:\Program Files\Docker\Docker\Docker Desktop.exe""

# (Đợi khoảng 5-10 giây cho Docker khởi động) rồi tải và chạy container Redis
docker run -d --name redis -p 6379:6379 redis

# Kiểm tra lại xem container "redis" đã chạy thành công chưa
docker ps

# Bật nhanh Redis để bắt đầu code (Nếu Docker Engine chưa chạy, chạy lại lệnh khởi động ở mục 1 trước)
docker start redis

# Tắt Redis khi đã code xong để giải phóng RAM cho máy
docker stop redis

# Xem danh sách các container đang hoạt động
docker ps

1. Xem các socket đang mở của bạn (Kiểu Set)
Gõ lệnh sau để xem danh sách các ID socket ứng với các tab bạn đang mở:

Bash
smembers "user:connections:5e21449a-8dc1-41e5-a08d-6f63e4f2a42d"
2. Xem chi tiết trạng thái Online (Kiểu Hash)
Gõ lệnh này để in ra các cặp trường lẻ-chẵn (status và last_active) như bạn vừa nhận xạ lúc nãy:

Bash
hgetall "user:presence:5e21449a-8dc1-41e5-a08d-6f63e4f2a42d"
3. Xem danh sách tổng hợp những người online (Kiểu Sorted Set)
Gõ lệnh này để xem tất cả userId đang online kèm theo điểm số timestamp hoạt động mới nhất của họ:

Bash
zrange "presence:online_users" 0 -1 withedscores
(Nếu bản Redis cũ báo lỗi chữ withedscores, bạn chỉ cần đổi thành withscores là được).
```
Webchat
├─ be
│  ├─ .env
│  ├─ chat.sql
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ server.js
│  └─ src
│     ├─ config
│     │  ├─ cloudinary.config.js
│     │  ├─ db.config.js
│     │  ├─ env.config.js
│     │  ├─ redis.config.js
│     │  └─ server.config.js
│     ├─ controller
│     │  ├─ auth.controller.js
│     │  ├─ conversation.controller.js
│     │  ├─ friend.controller.js
│     │  ├─ message.controller.js
│     │  └─ user.controller.js
│     ├─ middlewares
│     │  ├─ checkGroupChat.js
│     │  ├─ protectRoute.js
│     │  ├─ socketAuth.js
│     │  ├─ validate.js
│     │  ├─ verifyResetPassword.js
│     │  └─ verifySignup.js
│     ├─ routes
│     │  ├─ auth.routes.js
│     │  ├─ conversation.routes.js
│     │  ├─ friend.routes.js
│     │  ├─ message.routes.js
│     │  └─ user.routes.js
│     ├─ services
│     │  ├─ auth.service.js
│     │  ├─ conversation.service.js
│     │  ├─ friend.service.js
│     │  ├─ message.service.js
│     │  ├─ recommendation.service.js
│     │  └─ user.service.js
│     ├─ sockets
│     │  ├─ conversation.socket.js
│     │  ├─ index.js
│     │  ├─ message.socket.js
│     │  └─ presence.socket.js
│     └─ utils
│        ├─ presenceWorker.js
│        └─ utils.js
├─ docs
│  ├─ API_DOC.md
│  ├─ project_gap_assessment_plan.md
│  ├─ redis_presence_recommendation_plan.md
│  ├─ SRS_Webchat_realtime.md
│  └─ swagger.yaml
├─ fe
│  ├─ dist
│  │  ├─ assets
│  │  │  ├─ auth-B-v2zKgs.png
│  │  │  ├─ index-BHrthtCa.js
│  │  │  ├─ index-iHXt8V8i.css
│  │  │  ├─ logoauth-fBtg_yNQ.png
│  │  │  └─ user_avatar-Bzrj67bo.png
│  │  └─ public
│  │     └─ index.html
│  ├─ eslint.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  └─ index.html
│  ├─ src
│  │  ├─ apis
│  │  │  ├─ auth.apis.js
│  │  │  ├─ axiosClient.js
│  │  │  ├─ conversation.apis.js
│  │  │  ├─ message.apis.js
│  │  │  └─ user.apis.js
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ images
│  │  │  │  ├─ auth.png
│  │  │  │  ├─ logoauth.png
│  │  │  │  └─ user_avatar.png
│  │  │  └─ styles
│  │  │     ├─ auth.css
│  │  │     ├─ chat.css
│  │  │     ├─ chatinfo.css
│  │  │     ├─ contacts.css
│  │  │     ├─ layout.css
│  │  │     ├─ sidebar.css
│  │  │     ├─ storage.css
│  │  │     └─ userinfo.css
│  │  ├─ components
│  │  │  ├─ ChatInfo.jsx
│  │  │  ├─ LayoutPage.jsx
│  │  │  ├─ Sidebar.jsx
│  │  │  └─ UserInfo.jsx
│  │  ├─ context
│  │  │  ├─ AuthContext.jsx
│  │  │  └─ SocketContext.jsx
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ AuthPage.jsx
│  │  │  ├─ Chat.jsx
│  │  │  ├─ Contacts.jsx
│  │  │  └─ Storage.jsx
│  │  ├─ services
│  │  │  ├─ auth.service.js
│  │  │  ├─ conversation.service.js
│  │  │  ├─ message.service.js
│  │  │  ├─ socket.js
│  │  │  └─ user.service.js
│  │  └─ utils
│  └─ vite.config.js
├─ implementation_guide.md
└─ README.md

```