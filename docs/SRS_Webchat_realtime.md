# Software Requirements Specification (SRS)
## Ivanix — Web Chat Realtime

**Phiên bản:** 1.0  
**Ngày cập nhật:** 2026-08-06  
**Trạng thái:** Draft

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Mô tả tổng quát](#2-mô-tả-tổng-quát)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Kiến trúc hệ thống](#4-kiến-trúc-hệ-thống)
5. [Yêu cầu chức năng](#5-yêu-cầu-chức-năng)
6. [Yêu cầu phi chức năng](#6-yêu-cầu-phi-chức-năng)
7. [Database Design](#7-database-design)
8. [Socket.IO Design](#8-socketio-design)
9. [Security](#9-security)
10. [Phạm vi triển khai hiện tại](#10-phạm-vi-triển-khai-hiện-tại)

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này mô tả các yêu cầu chức năng và phi chức năng của hệ thống **Ivanix Web Chat Realtime** — một ứng dụng nhắn tin trực tuyến hỗ trợ cả chat cá nhân và nhóm, truyền file/ảnh, quản lý bạn bè và gợi ý kết bạn dựa trên mạng lưới quan hệ xã hội.

### 1.2 Phạm vi hệ thống

Hệ thống bao gồm:
- **Frontend (React SPA):** Giao diện người dùng chạy trên trình duyệt.
- **Backend (Express + Socket.IO):** REST API và realtime server.
- **Database (PostgreSQL):** Lưu trữ dữ liệu bền vững.
- **Cache (Redis):** Quản lý trạng thái online và cache gợi ý kết bạn.
- **File Storage (Cloudinary):** Lưu trữ ảnh đại diện và file đính kèm.

### 1.3 Định nghĩa và từ viết tắt

| Thuật ngữ | Định nghĩa |
|---|---|
| SRS | Software Requirements Specification |
| JWT | JSON Web Token |
| SPA | Single Page Application |
| REST | Representational State Transfer |
| TTL | Time To Live (thời gian sống của cache) |
| Conversation | Hội thoại (private hoặc group) |
| Room | Socket.IO room tương ứng với một conversation |

---

## 2. Mô tả tổng quát

### 2.1 Bối cảnh sản phẩm

Ivanix là ứng dụng chat web cho phép người dùng nhắn tin theo thời gian thực, kết bạn, tạo nhóm chat và chia sẻ file/ảnh. Hệ thống sử dụng cơ chế JWT trong httpOnly cookie để xác thực, Socket.IO để truyền tải realtime, và Redis để tăng tốc truy vấn trạng thái online và gợi ý.

### 2.2 Người dùng mục tiêu

- **Người dùng cuối:** Cá nhân muốn nhắn tin, kết bạn và trao đổi file qua web.
- **Quản trị nhóm:** Người tạo nhóm chat, có quyền quản lý thành viên.

### 2.3 Các ràng buộc hệ thống

- Chỉ hỗ trợ trình duyệt web hiện đại (Chrome, Firefox, Edge).
- File upload tối đa 5 file / lần gửi.
- Kết quả tìm kiếm người dùng giới hạn 15 bản ghi.
- Gợi ý kết bạn trả tối đa 10 kết quả.

---

## 3. Công nghệ sử dụng

| Layer | Công nghệ | Phiên bản |
|---|---|---|
| Frontend | React | 19 |
| Frontend router | React Router | v6 |
| Frontend build | Vite | 8 |
| HTTP client | Axios | ^1.13 |
| Realtime client | Socket.IO Client | v4 |
| Backend framework | Express | 4 |
| Realtime server | Socket.IO | v4 |
| Authentication | JWT (jsonwebtoken) + httpOnly Cookie | — |
| Database | PostgreSQL + pg_trgm | >= 14 |
| Cache / Presence | Redis (ioredis) | — |
| File storage | Cloudinary | — |
| File upload | Multer | — |
| Validation | express-validator | 7.3 |
| Password hashing | bcryptjs | — |
| Scheduler | node-cron | — |

---

## 4. Kiến trúc hệ thống

### 4.1 Tổng quan

```
Client (React SPA)
  │
  ├── REST API calls (Axios, withCredentials)
  │     └── Express Routes → Middlewares → Controllers → Services → PostgreSQL
  │
  └── Socket.IO (withCredentials)
        └── socketAuth middleware → Socket Handlers → Services → PostgreSQL / Redis
                                                              → io.emit() → Clients
```

### 4.2 Các layer Backend

| Layer | Trách nhiệm |
|---|---|
| **Routes** | Định nghĩa endpoint, gắn middleware |
| **Middlewares** | Auth, validation, permission check |
| **Controllers** | Nhận request, gọi service, trả response |
| **Services** | Business logic, query DB |
| **Sockets** | Xử lý Socket.IO events, gọi service, emit events |
| **Workers** | Background jobs (presence cleanup, recommendation cron) |
| **Config** | Kết nối DB, Redis, Cloudinary, khởi tạo server |

### 4.3 Luồng xác thực

```
Signup/Login → Controller → bcrypt hash/verify → SET jwt cookie (httpOnly)

Mọi request REST → protectRoute → verify JWT → req.userId
Socket connect   → socketAuth  → verify JWT → socket.userId
```

---

## 5. Yêu cầu chức năng

### 5.1 Authentication

#### UC-AUTH-01: Đăng ký tài khoản
- **Actor:** Người dùng chưa có tài khoản
- **Input:** username, email, password
- **Quy tắc nghiệp vụ:**
  - Username và email phải là duy nhất trong hệ thống.
  - Password được hash bằng bcryptjs trước khi lưu.
  - Backend set cookie `jwt` httpOnly sau khi tạo thành công.
- **Output:** Tài khoản mới, cookie jwt được set.

#### UC-AUTH-02: Đăng nhập
- **Actor:** Người dùng đã có tài khoản
- **Input:** email, password, rememberMe (tùy chọn)
- **Quy tắc nghiệp vụ:**
  - Xác thực email + password hash.
  - `rememberMe: true` kéo dài thời hạn cookie.
- **Output:** Cookie jwt được set, user object trả về.

#### UC-AUTH-03: Đăng xuất
- **Actor:** Người dùng đang đăng nhập
- **Quy tắc nghiệp vụ:** Xóa cookie `jwt` phía server.
- **Output:** Cookie xóa, user được redirect về trang login.

---

### 5.2 User Profile

#### UC-USER-01: Xem profile
- Lấy thông tin hiện tại: id, username, email, avatar_url, last_seen.

#### UC-USER-02: Tìm kiếm người dùng
- Tìm kiếm theo username (full-text, pg_trgm).
- Loại trừ chính user đang tìm.
- Giới hạn 15 kết quả.

#### UC-USER-03: Cập nhật profile
- Người dùng có thể đổi username và/hoặc ảnh đại diện.
- Ảnh được upload lên Cloudinary folder `avatars`.

---

### 5.3 Conversations

#### UC-CONV-01: Tạo/lấy private chat
- Khi user A muốn chat với user B, hệ thống kiểm tra `participant_key`.
- Nếu đã tồn tại → trả về conversation cũ.
- Nếu chưa → tạo mới và thêm 2 member.

#### UC-CONV-02: Tạo group chat
- User tạo group trở thành admin.
- Group phải có ít nhất 2 thành viên khác (ngoài người tạo).

#### UC-CONV-03: Thêm thành viên vào group
- Chỉ member trong conversation mới có thể thêm.
- Có kiểm tra giới hạn số lượng thành viên.

#### UC-CONV-04: Lấy danh sách conversation
- Trả toàn bộ conversation mà user đang tham gia.
- Kèm thông tin: last message, unread count, thông tin partner (private chat).
- Sắp xếp theo thời gian tin nhắn cuối giảm dần.

#### UC-CONV-05: Rời conversation
- Với group chat: nếu là admin duy nhất phải chuyển quyền trước.
- Xóa user khỏi conversation_members.

#### UC-CONV-06: Xóa lịch sử chat (phía mình)
- Cập nhật `cleared_history_at` của user trong conversation.
- Không xóa dữ liệu thực, chỉ ẩn tin nhắn cũ hơn timestamp đó.

#### UC-CONV-07: Quản lý group (Admin)
- Xóa thành viên khỏi group.
- Đổi tên group.
- Chuyển quyền admin sang thành viên khác.
- Giải tán group (xóa toàn bộ conversation).

#### UC-CONV-08: Lấy file/ảnh trong hội thoại
- Lọc theo loại: `image` hoặc `file`.
- Dùng cho trang Storage.

---

### 5.4 Messages

#### UC-MSG-01: Gửi tin nhắn text
- Qua REST API hoặc Socket.IO.
- `clientOffset` dùng để chống gửi trùng (idempotency).
- Server cập nhật last_message của conversation.
- Server tăng `unread_count` cho tất cả member khác.

#### UC-MSG-02: Gửi file/ảnh
- Tối đa 5 file mỗi lần.
- Upload lên Cloudinary, lưu thông tin vào `message_attachments`.
- Server emit `message:new` vào room Socket.IO sau khi lưu.

#### UC-MSG-03: Lấy lịch sử tin nhắn
- Lấy theo `conversationId`.
- Kiểm tra user có phải member không.
- Chỉ trả tin nhắn sau `cleared_history_at` của user.

---

### 5.5 Friends

#### UC-FRIEND-01: Gửi lời mời kết bạn
- Không thể gửi cho chính mình.
- Không thể gửi nếu đã là bạn.
- Không thể gửi nếu đang có pending request (cả 2 chiều).
- Chống race condition bằng unique index `idx_unique_pending_pair`.

#### UC-FRIEND-02: Phản hồi lời mời
- **Chấp nhận (`accepted`):** Xóa friend_request, tạo friendship (user_id1 < user_id2). Thực hiện trong transaction.
- **Từ chối (`rejected`):** Xóa friend_request. Thực hiện trong transaction.

#### UC-FRIEND-03: Hủy lời mời đã gửi
- Người gửi có thể hủy lời mời đang pending.

#### UC-FRIEND-04: Xem danh sách bạn bè
- Trả toàn bộ bạn bè hiện tại (cả 2 chiều từ bảng friendships).

#### UC-FRIEND-05: Xem lời mời nhận được
- Danh sách pending requests gửi tới user hiện tại.

#### UC-FRIEND-06: Xem lời mời đã gửi
- Danh sách lời mời mà user hiện tại đã gửi đi.

---

### 5.6 Realtime / Socket.IO

#### UC-SOCKET-01: Presence Management
- Khi connect: ghi vào Redis (connections Set, presence Hash, onlineUsers Sorted Set). Broadcast `getOnlineUsers`.
- Khi disconnect: xóa socketId. Nếu hết tab → đánh dấu offline, sync last_seen về Postgres. Broadcast `getOnlineUsers`.
- Heartbeat từ client (25s/lần): cập nhật timestamp Redis.
- PresenceWorker (30s/lần): dọn zombie connection quá 45s không heartbeat.

#### UC-SOCKET-02: Conversation Room
- Client join room `conversation:{conversationId}` sau khi mở chat.
- Server verify user là member trước khi cho join.
- Client leave room khi đóng chat.

#### UC-SOCKET-03: Realtime Messaging
- Client emit `message:send` với content và clientOffset.
- Server lưu DB, emit `message:new` vào room.
- Client nhận `message:new`, hiển thị tin nhắn.
- Callback trả kết quả cho client gửi.

---

### 5.7 Friend Recommendation

#### UC-REC-01: Tính toán gợi ý (Background)
- Chạy lúc server khởi động và mỗi 2 giờ (node-cron).
- Thu thập 3 nguồn signal: mutual friends, mutual groups, recent interactions (30 ngày).
- Loại trừ bạn bè hiện có và pending requests.
- Tính static score bằng log-weighted formula.
- Lưu Top 100 features vào Redis Hash (TTL 24h).

#### UC-REC-02: Lấy gợi ý (API)
- Đọc features từ Redis.
- Cộng online boost nhỏ (+3).
- Batch query profile từ Postgres.
- Trả Top 10 (loại trừ lại bạn bè / pending tại thời điểm query).
- Fallback (cache trống): user mới nhất từ Postgres.

---

## 6. Yêu cầu phi chức năng

### 6.1 Performance

| Tiêu chí | Yêu cầu |
|---|---|
| Độ trễ REST API (p95) | < 500ms trong điều kiện bình thường |
| Độ trễ Socket.IO message | < 100ms trong mạng LAN |
| Presence broadcast | < 1s sau khi connect/disconnect |
| Recommendation API | < 200ms (phần lớn từ Redis cache) |

### 6.2 Reliability

- Socket.IO `connectionStateRecovery` bật sẵn để client tự reconnect và nhận lại message bị miss.
- `client_offset` (UNIQUE constraint) đảm bảo idempotency khi retry gửi tin nhắn.
- `server_offset` (BIGSERIAL) dùng cho Socket.IO recovery protocol.

### 6.3 Security

- JWT lưu trong `httpOnly` cookie — không thể đọc bằng JavaScript.
- `sameSite: None, secure: true` cho CORS cross-site cookie.
- Password hash bcryptjs (10 rounds).
- CORS whitelist chỉ cho phép `CLIENT_URL`.
- Mọi route protected đều qua `protectRoute` / `socketAuth`.
- Permission check trước mọi thao tác nhạy cảm (checkGroupAdmin, checkConversationMember).

### 6.4 Scalability (Định hướng)

- Redis Sorted Set cho presence có thể scale theo số user online.
- Recommendation cache Redis giảm tải Postgres.
- Socket.IO cần `@socket.io/redis-adapter` khi scale ngang nhiều instance.

---

## 7. Database Design

Schema đầy đủ tại [`be/chat.sql`](../be/chat.sql).

### 7.1 Bảng `users`

| Column | Type | Mô tả |
|---|---|---|
| id | UUID PK | gen_random_uuid() |
| username | VARCHAR(50) UNIQUE | Tên đăng nhập |
| email | VARCHAR(100) UNIQUE | Email |
| password_hash | TEXT | bcryptjs hash |
| avatar_url | TEXT | URL Cloudinary |
| last_seen | TIMESTAMPTZ | Cập nhật khi disconnect |
| created_at | TIMESTAMPTZ | Thời điểm tạo |

**Indexes:** username_lower, email_lower (btree), username_trgm (GIN pg_trgm)

### 7.2 Bảng `conversations`

| Column | Type | Mô tả |
|---|---|---|
| id | UUID PK | — |
| type | VARCHAR(10) | `private` hoặc `group` |
| name | VARCHAR(100) | Tên nhóm (null với private chat) |
| participant_key | TEXT UNIQUE | Sorted UUID pair để unique private chat |
| last_message_at | TIMESTAMPTZ | Dùng để sort sidebar |
| last_message_sender_id | UUID FK | — |
| last_message_id | UUID FK | Circular FK với messages |
| created_at | TIMESTAMPTZ | — |

### 7.3 Bảng `conversation_members`

| Column | Type | Mô tả |
|---|---|---|
| id | UUID PK | — |
| conversation_id | UUID FK | → conversations |
| user_id | UUID FK | → users |
| role | VARCHAR(20) | `admin` hoặc `member` |
| unread_count | INT | Số tin nhắn chưa đọc |
| cleared_history_at | TIMESTAMPTZ | Mốc xóa lịch sử phía mình |
| joined_at | TIMESTAMPTZ | — |

**Unique:** (conversation_id, user_id)

### 7.4 Bảng `messages`

| Column | Type | Mô tả |
|---|---|---|
| id | UUID PK | — |
| server_offset | BIGSERIAL UNIQUE | Socket.IO recovery |
| client_offset | TEXT UNIQUE | Idempotency key |
| conversation_id | UUID FK | → conversations |
| sender_id | UUID FK | → users (SET NULL on delete) |
| content | TEXT | Nội dung (null nếu type=file) |
| message_type | VARCHAR(20) | `text` hoặc `file` |
| is_deleted | BOOLEAN | — |
| deleted_at | TIMESTAMPTZ | — |
| created_at | TIMESTAMPTZ | — |

### 7.5 Bảng `message_attachments`

| Column | Type | Mô tả |
|---|---|---|
| id | UUID PK | — |
| message_id | UUID FK | → messages (CASCADE) |
| file_url | TEXT | URL Cloudinary |
| file_public_id | TEXT | ID Cloudinary (dùng để xóa) |
| file_name | VARCHAR(255) | Tên file gốc |
| mime_type | VARCHAR(100) | MIME type |
| file_size | BIGINT | Kích thước bytes |
| display_order | SMALLINT | Thứ tự hiển thị |
| created_at | TIMESTAMPTZ | — |

### 7.6 Bảng `message_seen`

| Column | Type | Mô tả |
|---|---|---|
| message_id | UUID FK | → messages |
| user_id | UUID FK | → users |
| seen_at | TIMESTAMPTZ | — |

**PK:** (message_id, user_id)

### 7.7 Bảng `friend_requests`

| Column | Type | Mô tả |
|---|---|---|
| id | UUID PK | — |
| sender_id | UUID FK | → users |
| receiver_id | UUID FK | → users |
| status | VARCHAR(20) | `pending`, `accepted`, `rejected` |
| created_at | TIMESTAMPTZ | — |
| updated_at | TIMESTAMPTZ | — |

**Unique:** (sender_id, receiver_id)  
**Unique Index:** idx_unique_pending_pair — LEAST/GREATEST để ngăn 2 chiều tồn tại đồng thời

### 7.8 Bảng `friendships`

| Column | Type | Mô tả |
|---|---|---|
| user_id1 | UUID FK | < user_id2 (constraint) |
| user_id2 | UUID FK | — |
| created_at | TIMESTAMPTZ | — |

**PK:** (user_id1, user_id2) — normalized với user_id1 < user_id2

---

## 8. Socket.IO Design

### 8.1 Authentication

Socket.IO sử dụng cùng cơ chế JWT cookie với REST API qua middleware `socketAuth`.

### 8.2 Room Naming Convention

```
conversation:{conversationId}
```

### 8.3 Redis Presence Keys

```
user:connections:{userId}     → Set:        { socketId, socketId, ... }
user:presence:{userId}        → Hash:       { status, last_active }
presence:online_users         → Sorted Set: { userId: timestamp, ... }
user:recommendation_features:{userId} → Hash: { targetId: '{mf, mgw, ri}', ... }
```

### 8.4 Event Flow

```
Client connect
  ↓
socketAuth (verify JWT)
  ↓
registerPresenceHandlers → handleConnect() → Redis write → io.emit("getOnlineUsers")
registerConvHandlers
registerMessageHandlers
  ↓
Client: emit("heartbeat")          → Redis update timestamp
Client: emit("conversation:join")  → DB check member → socket.join(room)
Client: emit("message:send")       → DB save → io.to(room).emit("message:new")
Client: disconnect                 → Redis cleanup → optional Postgres sync → io.emit("getOnlineUsers")
```

---

## 9. Security

### 9.1 Authentication & Authorization

- JWT được ký bằng `JWT_SECRET` từ biến môi trường.
- Cookie `httpOnly` ngăn XSS đọc token.
- `sameSite: None, secure: true` cho phép cross-site cookie trong HTTPS.
- Mỗi request và socket connection đều phải xác thực.

### 9.2 Input Validation

- express-validator kiểm tra tất cả input tại tầng middleware.
- Middleware riêng kiểm tra username/email duy nhất trước khi tạo tài khoản.

### 9.3 Access Control

- `checkConversationMember`: Chỉ member mới được thao tác với conversation / messages.
- `checkGroupAdmin`: Chỉ admin mới được thực hiện các thao tác quản trị group.
- `checkGroupMemberLimit`: Ngăn thêm quá nhiều thành viên vào group.

### 9.4 File Upload

- Multer giới hạn số lượng file (5 file/lần).
- File được lưu trữ trên Cloudinary, không lưu trực tiếp trên server.

---

## 10. Phạm vi triển khai hiện tại

### 10.1 Đã triển khai đầy đủ

| Tính năng | Backend | Frontend |
|---|---|---|
| Signup / Login / Logout | ✅ | ✅ |
| Xem / cập nhật profile, avatar | ✅ | ✅ |
| Tìm kiếm người dùng | ✅ | ✅ |
| Tạo / lấy private chat | ✅ | ✅ |
| Tạo / quản lý group chat | ✅ | ✅ |
| Danh sách conversation (sidebar) | ✅ | ✅ |
| Gửi / nhận tin nhắn text (REST + Socket.IO) | ✅ | ✅ |
| Upload và gửi file/ảnh | ✅ | ✅ |
| Presence (online/offline realtime) | ✅ | ✅ |
| Heartbeat + PresenceWorker | ✅ | ✅ |
| Kết bạn (send/accept/reject/cancel) | ✅ | ✅ |
| Xóa bạn bè (unfriend) | ✅ | ⬜ (FE chưa wire handler) |
| Gợi ý kết bạn (ML-lite, Redis cache) | ✅ | ✅ |
| Xóa lịch sử chat phía mình | ✅ | ✅ |
| Lấy file/ảnh trong hội thoại | ✅ | ✅ |
| Rời nhóm / Giải tán nhóm | ✅ | ✅ |
| Chuyển admin / Đổi tên nhóm | ✅ | ✅ |
| Realtime conversation:new (socket emit) | ✅ | ⬜ (FE listener chưa có) |

### 10.2 Chưa triển khai / Còn thiếu logic

Xem chi tiết tại [`docs/BACKLOG.md`](BACKLOG.md).
