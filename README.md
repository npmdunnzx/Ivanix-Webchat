# Ivanix — Web Chat Realtime

Ivanix là ứng dụng chat realtime full-stack hỗ trợ nhắn tin cá nhân và nhóm, gửi file/ảnh, theo dõi trạng thái online, kết bạn, và gợi ý kết bạn thông minh dựa trên mạng lưới quan hệ xã hội.

---

## Mục lục

- [Tech Stack](#tech-stack)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Luồng dữ liệu chính](#luồng-dữ-liệu-chính)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt & Chạy dự án](#cài-đặt--chạy-dự-án)
- [Biến môi trường](#biến-môi-trường)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Socket.IO Events](#socketio-events)

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| **Frontend** | React 19, React Router v6, Vite 8 |
| **Styling** | Vanilla CSS, Bootstrap Icons, Lucide React |
| **HTTP Client** | Axios (withCredentials) |
| **Realtime Client** | Socket.IO Client v4 |
| **Backend** | Node.js, Express 4 |
| **Realtime Server** | Socket.IO v4 |
| **Authentication** | JWT lưu trong httpOnly Cookie |
| **Database** | PostgreSQL (với pg_trgm để tìm kiếm) |
| **Cache / Presence** | Redis (ioredis) |
| **File Storage** | Cloudinary |
| **File Upload** | Multer |
| **Validation** | express-validator |
| **Scheduler** | node-cron |
| **Password Hashing** | bcryptjs |

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────┐
│         React (Frontend)        │
│  React Router / Context / Axios │
└────────────┬──────────┬─────────┘
             │ REST     │ Socket.IO
             ▼          ▼
┌─────────────────────────────────┐
│      Express + Socket.IO        │
│   (Node.js — port 4000)         │
│                                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │  Routes  │  │   Sockets   │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │               │         │
│  ┌────▼───────────────▼──────┐  │
│  │     Services / Business   │  │
│  └───────┬───────────────────┘  │
└──────────┼──────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐  ┌──────────┐
│Postgres│  │  Redis   │
│  (DB)  │  │(Cache/   │
│        │  │Presence) │
└────────┘  └──────────┘
                │
                ▼
         ┌───────────┐
         │ Cloudinary│
         │(File/Img) │
         └───────────┘
```

---

## Luồng dữ liệu chính

### Luồng xác thực (Auth Flow)

```
Client  →  POST /api/auth/login
        ←  Set-Cookie: jwt (httpOnly)
        ←  { user: { id, username, email, avatar_url } }

Mọi request REST sau đó:
  Client  →  API (Cookie jwt tự gửi kèm)
          →  protectRoute middleware xác thực JWT
          →  giải mã → gán req.userId, req.email

Socket.IO connect:
  Client  →  io.connect (withCredentials: true)
          →  socketAuth middleware xác thực JWT từ cookie
          →  gán socket.userId
```

### Luồng gửi tin nhắn (Message Flow)

```
Option A — REST:
  Client  →  POST /api/messages  { conversationId, content, messageType, clientOffset }
          ←  { message: "sent", data: { message object } }

Option B — Socket.IO (realtime):
  Client  →  emit("message:send", { clientOffset, conversationId, content })
  Server  →  lưu DB, emit("message:new", message) → toàn bộ room conversation
  Client  ←  nhận "message:new", hiển thị lên giao diện
```

### Luồng upload file

```
Client  →  POST /api/messages/files (multipart/form-data, tối đa 5 file)
           { conversationId, clientOffset, files[] }
Server  →  Multer đọc file → Cloudinary upload → lưu message_attachments DB
        →  io.emit("message:new", message) → room conversation
Client  ←  nhận "message:new", render FileAttachment component
```

### Luồng Presence (Online/Offline)

```
Socket connect:
  → Redis: SADD user:connections:{userId} socketId
           HSET user:presence:{userId} { status: "online", last_active: now }
           ZADD presence:online_users now userId
  → io.emit("getOnlineUsers", [...userIds])

Heartbeat (client gửi mỗi 25s):
  → Redis: HSET last_active, ZADD score mới (keep alive)

Socket disconnect:
  → Redis: SREM socketId
  → Nếu không còn tab nào → đánh dấu offline, xóa khỏi sorted set
  → UPDATE users SET last_seen = NOW() (Postgres)
  → io.emit("getOnlineUsers", [...userIds])

PresenceWorker (chạy mỗi 30s):
  → Dọn zombie user (heartbeat quá hạn 45s)
  → Đồng bộ last_seen về Postgres hàng loạt
```

### Luồng gợi ý kết bạn (Recommendation Flow)

```
RecommendationWorker (node-cron, mỗi 2 giờ + chạy lúc server khởi động):
  → Query Postgres: mutual friends, mutual groups, recent interactions (30 ngày)
  → Tính static score (log-weighted formula)
  → Loại bỏ bạn bè hiện có và pending requests
  → Lưu Top 100 candidate features vào Redis Hash (TTL 24h)

GET /api/recommendations:
  → Đọc features từ Redis
  → Cộng online boost (pipeline Redis)
  → Batch query profile từ Postgres
  → Sort, trả Top 10
  → Fallback (Redis trống): user mới nhất từ Postgres
```

---

## Cấu trúc thư mục

```
Webchat/
├── README.md
├── be/                           # Backend (Node.js + Express)
│   ├── .env
│   ├── chat.sql                  # Database schema
│   ├── package.json
│   ├── server.js                 # Entry point
│   └── src/
│       ├── config/
│       │   ├── cloudinary.config.js
│       │   ├── db.config.js
│       │   ├── env.config.js
│       │   ├── multer.config.js
│       │   ├── redis.config.js
│       │   └── server.config.js  # Express app, Socket.IO, CORS, route mounting
│       ├── controller/           # HTTP request handlers
│       │   ├── auth.controller.js
│       │   ├── conversation.controller.js
│       │   ├── friend.controller.js
│       │   ├── message.controller.js
│       │   ├── recommendation.controller.js
│       │   └── user.controller.js
│       ├── middlewares/
│       │   ├── checkGroupChat.js      # checkGroupAdmin, checkConversationMember, checkGroupMemberLimit
│       │   ├── protectRoute.js        # JWT cookie auth cho REST
│       │   ├── socketAuth.js          # JWT cookie auth cho Socket.IO
│       │   ├── validate.js            # express-validator rules
│       │   ├── verifyResetPassword.js
│       │   └── verifySignup.js        # checkExistEmail, checkExistUsername
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── conversation.routes.js
│       │   ├── friend.routes.js
│       │   ├── message.routes.js
│       │   ├── recommendation.routes.js
│       │   └── user.routes.js
│       ├── services/             # Business logic / DB queries
│       │   ├── auth.service.js
│       │   ├── conversation.service.js
│       │   ├── friend.service.js
│       │   ├── message.service.js
│       │   ├── recommendation.service.js
│       │   ├── upload.service.js
│       │   └── user.service.js
│       ├── sockets/              # Socket.IO event handlers
│       │   ├── index.js
│       │   ├── conversation.socket.js
│       │   ├── message.socket.js
│       │   └── presence.socket.js
│       └── utils/
│           ├── presenceWorker.js      # Dọn zombie connections mỗi 30s
│           ├── recommendationWorker.js # Cron tính recommendation mỗi 2h
│           └── utils.js
│
├── fe/                           # Frontend (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx               # Router chính
│       ├── main.jsx
│       ├── apis/                 # Axios API call functions
│       │   ├── axiosClient.js    # Instance Axios withCredentials
│       │   ├── auth.apis.js
│       │   ├── conversation.apis.js
│       │   ├── friend.apis.js
│       │   ├── message.apis.js
│       │   ├── recommendation.apis.js
│       │   └── user.apis.js
│       ├── assets/
│       │   ├── images/
│       │   └── styles/           # Vanilla CSS per-page/component
│       ├── components/
│       │   ├── AddMemberModal.jsx
│       │   ├── AuthLoadingScreen.jsx
│       │   ├── ChatInfo.jsx
│       │   ├── ConfirmModal.jsx
│       │   ├── CreateGroupModal.jsx
│       │   ├── FileAttachment.jsx
│       │   ├── LayoutPage.jsx
│       │   ├── MessageAttachments.jsx
│       │   ├── NewContactInfo.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── RenameGroupModal.jsx
│       │   ├── Sidebar.jsx
│       │   └── UserInfo.jsx
│       ├── context/
│       │   ├── AuthContext.jsx   # User auth state, login/logout
│       │   └── SocketContext.jsx # Socket.IO instance, online users
│       ├── pages/
│       │   ├── AuthPage.jsx      # Login / Signup
│       │   ├── Chat.jsx          # Trang chat chính
│       │   ├── Contacts.jsx      # Danh bạ, kết bạn, gợi ý
│       │   ├── Notification.jsx  # Thông báo
│       │   └── Settings.jsx      # Cài đặt tài khoản
│       ├── services/             # Business logic FE (wrap API calls)
│       └── utils/
│           └── toast.js
│
└── docs/
    ├── API_DOC.md
    ├── SRS_Webchat_realtime.md
    ├── BACKLOG.md
    ├── swagger.yaml
    └── UI_DESIGN_GUIDELINE.md
```

---

## Cài đặt & Chạy dự án

### Yêu cầu

- Node.js >= 18
- PostgreSQL >= 14
- Redis (khuyên dùng Docker)
- Tài khoản Cloudinary

### 1. Khởi động Redis (Docker)

```bash
# Lần đầu — tải và chạy container Redis
docker run -d --name redis -p 6379:6379 redis

# Các lần sau — chỉ cần start
docker start redis

# Dừng khi không dùng
docker stop redis
```

### 2. Tạo Database

```bash
psql -U postgres -c "CREATE DATABASE webchat;"
psql -U postgres -d webchat -f be/chat.sql
```

### 3. Cấu hình biến môi trường

Tạo file `be/.env` — xem mục [Biến môi trường](#biến-môi-trường).

### 4. Chạy Backend

```bash
cd be
npm install
nodemon server.js
# Server chạy tại http://localhost:4000
```

### 5. Chạy Frontend

```bash
cd fe
npm install
npm run dev
# App chạy tại http://localhost:5173
```

---

## Biến môi trường

Tạo file `be/.env`:

```env
# Server
PORT=4000
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/webchat

# JWT
JWT_SECRET=your_jwt_secret_key

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Database Schema

Schema đầy đủ tại [`be/chat.sql`](be/chat.sql).

| Bảng | Mô tả |
|---|---|
| `users` | Tài khoản người dùng (uuid, username, email, password_hash, avatar_url, last_seen) |
| `conversations` | Hội thoại private / group (participant_key để đảm bảo unique private chat) |
| `conversation_members` | Thành viên hội thoại (role: admin/member, unread_count, cleared_history_at) |
| `messages` | Tin nhắn (server_offset cho Socket.IO recovery, client_offset chống duplicate) |
| `message_attachments` | File/ảnh đính kèm (Cloudinary URL, mime_type, file_size, display_order) |
| `message_seen` | Trạng thái đã đọc (composite PK: message_id + user_id) |
| `friend_requests` | Lời mời kết bạn (status: pending/accepted/rejected) |
| `friendships` | Quan hệ bạn bè (user_id1 < user_id2 — normalized unique constraint) |

---

## API Overview

Base URL: `http://localhost:4000/api`

Authentication: Cookie `jwt` (httpOnly). Frontend dùng `withCredentials: true`.

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/auth/signup` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/logout` | Đăng xuất |
| GET | `/user/me` | Lấy profile hiện tại |
| GET | `/user/search?keyword=` | Tìm kiếm người dùng |
| PUT | `/user/profile` | Cập nhật profile / avatar |
| GET | `/conversations` | Lấy danh sách hội thoại |
| POST | `/conversations/private` | Tạo hoặc lấy private chat |
| POST | `/conversations/groups` | Tạo group chat |
| POST | `/conversations/groups/members` | Thêm thành viên vào group |
| GET | `/conversations/groups/:id/members` | Lấy danh sách thành viên group |
| GET | `/conversations/search?name=` | Tìm kiếm conversation |
| POST | `/conversations/leave` | Rời khỏi conversation |
| POST | `/conversations/:id/history` | Xóa lịch sử chat phía mình |
| POST | `/conversations/groups/members/remove` | Xóa thành viên (admin only) |
| PUT | `/conversations/groups/name` | Đổi tên group |
| PUT | `/conversations/groups/admin` | Chuyển quyền admin |
| DELETE | `/conversations/groups/:id` | Giải tán group (admin only) |
| GET | `/conversations/:id/attachments` | Lấy file/ảnh trong hội thoại |
| GET | `/messages?conversationId=` | Lấy tin nhắn |
| POST | `/messages` | Gửi tin nhắn text |
| POST | `/messages/files` | Upload và gửi file/ảnh |
| POST | `/friends/send-request` | Gửi lời mời kết bạn |
| POST | `/friends/response-request` | Chấp nhận / từ chối lời mời |
| POST | `/friends/cancel-request` | Hủy lời mời đã gửi |
| GET | `/friends` | Lấy danh sách bạn bè |
| GET | `/friends/pending-requests` | Lấy lời mời nhận được |
| GET | `/friends/my-requests` | Lấy lời mời đã gửi |
| DELETE | `/friends/delete-friend` | Xóa bạn bè (unfriend) |
| GET | `/recommendations` | Gợi ý kết bạn (Top 10) |

Chi tiết đầy đủ xem tại [`docs/API_DOC.md`](docs/API_DOC.md).

---

## Socket.IO Events

Server URL: `http://localhost:4000`

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:4000", { withCredentials: true });
```

| Event | Hướng | Mô tả |
|---|---|---|
| `getOnlineUsers` | Server → Client | Broadcast danh sách userId đang online |
| `heartbeat` | Client → Server | Client ping giữ kết nối (gửi mỗi 25s) |
| `presence:sync` | Client → Server | Client yêu cầu snapshot danh sách online ngay lập tức |
| `conversation:join` | Client → Server | Tham gia room conversation |
| `conversation:leave` | Client → Server | Rời room conversation |
| `conversation:new` | Server → Client | Server push khi user được thêm vào conversation mới |
| `message:send` | Client → Server | Gửi tin nhắn realtime |
| `message:new` | Server → Client | Server push tin nhắn mới vào room |

---

## Routes Frontend

| Path | Page | Mô tả |
|---|---|---|
| `/login` | AuthPage | Đăng nhập |
| `/signup` | AuthPage | Đăng ký |
| `/chat` | Chat | Trang chat (chưa chọn conversation) |
| `/chat/:type/:conversationId` | Chat | Trang chat đang mở conversation |
| `/contacts` | Contacts | Quản lý kết bạn, gợi ý bạn bè |
| `/settings` | Settings | Cài đặt tài khoản, đổi avatar |
| `/notifications` | Notification | Thông báo |