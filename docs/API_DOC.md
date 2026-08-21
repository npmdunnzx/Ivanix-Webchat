# API Documentation — Ivanix Web Chat Realtime

## Thông tin chung

| Mục | Giá trị |
|---|---|
| Base URL | `http://localhost:4000/api` |
| Content-Type | `application/json` |
| Authentication | Cookie `jwt` (httpOnly, sameSite: None, secure) |
| Frontend config | `axios.create({ withCredentials: true })` |

### Quy ước response lỗi

```json
{
  "message": "Mô tả lỗi",
  "error": "Chi tiết lỗi"
}
```

---

## 1. Authentication

### 1.1 Đăng ký tài khoản

```
POST /api/auth/signup
```

**Middleware:** `signupRule()` → `validate` → `checkExistUsername` → `checkExistEmail`

**Request body:**

```json
{
  "username": "manhdung",
  "email": "manh@example.com",
  "password": "Password123"
}
```

**Response `201 Created`:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "username": "manhdung",
    "email": "manh@example.com"
  }
}
```

**Ghi chú:**
- Backend tự động set cookie `jwt` sau khi tạo tài khoản thành công.
- Password được hash bằng bcryptjs trước khi lưu.
- Trả `400` nếu username hoặc email đã tồn tại.

---

### 1.2 Đăng nhập

```
POST /api/auth/login
```

**Middleware:** `loginRule()` → `validate`

**Request body:**

```json
{
  "email": "manh@example.com",
  "password": "Password123",
  "rememberMe": false
}
```

**Response `200 OK`:**

```json
{
  "message": "Login successfully",
  "user": {
    "id": "uuid",
    "username": "manhdung",
    "email": "manh@example.com",
    "avatar_url": "https://..."
  }
}
```

**Ghi chú:**
- `rememberMe: true` kéo dài thời hạn cookie.
- Trả `400` nếu email không tồn tại hoặc password sai.

---

### 1.3 Đăng xuất

```
POST /api/auth/logout
```

**Response `200 OK`:**

```json
{
  "message": "Logout successfully"
}
```

**Ghi chú:** Backend xóa cookie `jwt`.

---

## 2. User

### 2.1 Lấy profile hiện tại

```
GET /api/user/me
```

**Middleware:** `protectRoute`

**Response `200 OK`:**

```json
{
  "id": "uuid",
  "username": "manhdung",
  "email": "manh@example.com",
  "avatar_url": "https://...",
  "last_seen": "2026-08-06T10:00:00.000Z",
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

---

### 2.2 Tìm kiếm người dùng

```
GET /api/user/search?keyword=manh
```

**Middleware:** `protectRoute`

**Query params:**

| Param | Bắt buộc | Mô tả |
|---|---|---|
| `keyword` | Có | Chuỗi tìm kiếm theo username (full-text, pg_trgm) |

**Response `200 OK`:**

```json
[
  {
    "id": "uuid",
    "username": "manhdung",
    "avatar_url": "https://..."
  }
]
```

**Ghi chú:**
- Loại trừ user hiện tại khỏi kết quả.
- Giới hạn 15 kết quả.
- Dùng GIN index `pg_trgm` để tìm kiếm gần đúng.

---

### 2.3 Cập nhật profile

```
PUT /api/user/profile
```

**Middleware:** `protectRoute`, `multer.single("avatar")`

**Request:** `multipart/form-data`

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `username` | string | Không | Tên mới |
| `avatar` | file | Không | Ảnh đại diện mới |

**Response `200 OK`:**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "username": "manhdung_new",
    "avatar_url": "https://cloudinary.com/..."
  }
}
```

**Ghi chú:** File ảnh được upload lên Cloudinary folder `avatars`.

---

## 3. Conversations

### 3.1 Lấy danh sách hội thoại

```
GET /api/conversations
```

**Middleware:** `protectRoute`

**Response `200 OK`:**

```json
{
  "message": "Conversations fetched successfully",
  "result": [
    {
      "id": "uuid",
      "type": "private",
      "name": null,
      "last_message_at": "2026-08-06T10:00:00.000Z",
      "last_message_sender_id": "uuid",
      "last_message_id": "uuid",
      "last_message_content": "Xin chào!",
      "last_message_type": "text",
      "unread_count": 3,
      "partner_id": "uuid",
      "partner_username": "manh",
      "partner_avatar": "https://..."
    },
    {
      "id": "uuid",
      "type": "group",
      "name": "Team Webchat",
      "last_message_at": "2026-08-06T09:00:00.000Z",
      "last_message_sender_id": "uuid",
      "last_message_id": "uuid",
      "last_message_content": "Hello everyone!",
      "last_message_type": "text",
      "unread_count": 0,
      "partner_id": null,
      "partner_username": null,
      "partner_avatar": null
    }
  ]
}
```

**Ghi chú:** Sắp xếp theo `last_message_at` giảm dần. Với group chat, `partner_*` fields là `null`.

---

### 3.2 Tạo hoặc lấy private chat

```
POST /api/conversations/private
```

**Middleware:** `protectRoute`, `startConversationRule()`, `validate`

**Request body:**

```json
{
  "partnerId": "uuid"
}
```

**Response `200 OK` — conversation đã tồn tại:**

```json
{
  "message": "Chat already exists",
  "result": {
    "conversationId": "uuid",
    "created": false
  }
}
```

**Response `201 Created` — conversation mới:**

```json
{
  "message": "Private chat created successfully",
  "result": {
    "conversationId": "uuid",
    "created": true
  }
}
```

**Ghi chú:** Dùng `participant_key` (sorted UUID pair) để đảm bảo mỗi cặp user chỉ có 1 private conversation.

---

### 3.3 Tạo group chat

```
POST /api/conversations/groups
```

**Middleware:** `protectRoute`, `newGroupChatRule()`, `validate`

**Request body:**

```json
{
  "groupName": "Team Webchat",
  "membersId": ["uuid-1", "uuid-2"]
}
```

**Response `201 Created`:**

```json
{
  "message": "Group chat created successfully",
  "result": {
    "conversationId": "uuid",
    "created": true
  }
}
```

**Ghi chú:** User tạo group tự động là `admin`. Tối thiểu 2 thành viên (ngoài người tạo).

---

### 3.4 Thêm thành viên vào group

```
POST /api/conversations/groups/members
```

**Middleware:** `protectRoute`, `checkGroupMemberLimit`, `addMembersRule()`, `checkConversationMember`, `validate`

**Request body:**

```json
{
  "conversationId": "uuid",
  "membersId": ["uuid-3", "uuid-4"]
}
```

**Response `200 OK`:**

```json
{
  "message": "Members added successfully",
  "result": []
}
```

---

### 3.5 Lấy danh sách thành viên group

```
GET /api/conversations/groups/:conversation_id/members
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Response `200 OK`:**

```json
{
  "message": "Get group members successfully",
  "result": [
    {
      "user_id": "uuid",
      "username": "manhdung",
      "avatar_url": "https://...",
      "role": "admin",
      "joined_at": "2026-08-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3.6 Tìm kiếm conversation

```
GET /api/conversations/search?name=Team
```

**Middleware:** `protectRoute`

**Query params:**

| Param | Mô tả |
|---|---|
| `name` | Tìm theo tên group hoặc username partner |

**Response `200 OK`:**

```json
{
  "message": "Search conversation successfully",
  "result": []
}
```

---

### 3.7 Rời khỏi conversation

```
POST /api/conversations/leave
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Request body:**

```json
{
  "conversationId": "uuid"
}
```

**Response `200 OK`:**

```json
{
  "message": "Left conversation successfully"
}
```

**Response `403 Forbidden`** nếu admin cố rời group mà chưa chuyển quyền:

```json
{
  "message": "You are the only admin, please transfer admin role before leaving"
}
```

---

### 3.8 Xóa lịch sử chat (phía mình)

```
POST /api/conversations/:conversation_id/history
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Response `200 OK`:**

```json
{
  "message": "Deleted conversation successfully"
}
```

**Ghi chú:** Chỉ xóa lịch sử phía user thực hiện (cập nhật `cleared_history_at`). Không xóa dữ liệu thực.

---

### 3.9 Xóa thành viên khỏi group

```
POST /api/conversations/groups/members/remove
```

**Middleware:** `protectRoute`, `checkGroupAdmin`

**Request body:**

```json
{
  "conversationId": "uuid",
  "targetUserId": "uuid"
}
```

**Response `200 OK`:**

```json
{
  "message": "Member removed from group successfully"
}
```

---

### 3.10 Đổi tên group

```
PUT /api/conversations/groups/name
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Request body:**

```json
{
  "conversationId": "uuid",
  "groupName": "Tên mới"
}
```

**Response `200 OK`:**

```json
{
  "message": "Group renamed successfully",
  "result": { "id": "uuid", "name": "Tên mới" }
}
```

---

### 3.11 Chuyển quyền admin

```
PUT /api/conversations/groups/admin
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Request body:**

```json
{
  "conversationId": "uuid",
  "newAdminId": "uuid"
}
```

**Response `200 OK`:**

```json
{
  "message": "Admin transferred successfully"
}
```

---

### 3.12 Giải tán group

```
DELETE /api/conversations/groups/:conversation_id
```

**Middleware:** `protectRoute`, `checkGroupAdmin`

**Response `200 OK`:**

```json
{
  "message": "Group conversation deleted successfully"
}
```

---

### 3.13 Lấy file/ảnh trong hội thoại

```
GET /api/conversations/:conversation_id/attachments?type=image
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Query params:**

| Param | Mô tả |
|---|---|
| `type` | `image` hoặc `file` — lọc theo loại |

**Response `200 OK`:**

```json
{
  "message": "Get conversation attachments successfully",
  "result": [
    {
      "message_id": "uuid",
      "file_url": "https://...",
      "file_name": "photo.jpg",
      "mime_type": "image/jpeg",
      "file_size": 204800,
      "created_at": "2026-08-06T10:00:00.000Z"
    }
  ]
}
```

---

## 4. Messages

### 4.1 Lấy danh sách tin nhắn

```
GET /api/messages?conversationId=uuid
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Query params:**

| Param | Bắt buộc | Mô tả |
|---|---|---|
| `conversationId` | Có | ID conversation |

**Response `200 OK`:**

```json
[
  {
    "id": "uuid",
    "server_offset": 1,
    "content": "Hello",
    "message_type": "text",
    "is_deleted": false,
    "sender_id": "uuid",
    "sender_username": "manhdung",
    "sender_avt": "https://...",
    "created_at": "2026-08-06T10:00:00.000Z",
    "attachments": []
  },
  {
    "id": "uuid",
    "server_offset": 2,
    "content": null,
    "message_type": "file",
    "is_deleted": false,
    "sender_id": "uuid",
    "sender_username": "manhdung",
    "sender_avt": "https://...",
    "created_at": "2026-08-06T10:01:00.000Z",
    "attachments": [
      {
        "file_url": "https://...",
        "file_name": "document.pdf",
        "mime_type": "application/pdf",
        "file_size": 512000,
        "display_order": 0
      }
    ]
  }
]
```

**Ghi chú:** Chỉ trả tin nhắn sau `cleared_history_at` của user (nếu đã xóa lịch sử).

---

### 4.2 Gửi tin nhắn text

```
POST /api/messages
```

**Middleware:** `protectRoute`, `checkConversationMember`

**Request body:**

```json
{
  "conversationId": "uuid",
  "content": "Hello",
  "messageType": "text",
  "clientOffset": "client-unique-id-123"
}
```

**Response `201 Created`:**

```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "server_offset": 5,
    "sender_id": "uuid",
    "conversation_id": "uuid",
    "content": "Hello",
    "message_type": "text",
    "is_deleted": false,
    "created_at": "2026-08-06T10:00:00.000Z"
  }
}
```

**Ghi chú:**
- `clientOffset` dùng để chống gửi trùng (idempotency).
- Tự động cập nhật `last_message_id`, `last_message_at` của conversation.
- Tự động tăng `unread_count` cho tất cả member khác.

---

### 4.3 Upload và gửi file/ảnh

```
POST /api/messages/files
```

**Middleware:** `protectRoute`, `multer.array("files", 5)`, `checkConversationMember`

**Request:** `multipart/form-data`

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `conversationId` | string | Có | ID conversation |
| `clientOffset` | string | Không | ID chống duplicate |
| `files` | file[] | Có | Tối đa 5 file |

**Response `201 Created`:**

```json
{
  "message": "Files uploaded successfully",
  "data": {
    "id": "uuid",
    "server_offset": 6,
    "sender_id": "uuid",
    "conversation_id": "uuid",
    "content": null,
    "message_type": "file",
    "created_at": "2026-08-06T10:00:00.000Z",
    "attachments": [
      {
        "file_url": "https://res.cloudinary.com/...",
        "file_name": "photo.jpg",
        "mime_type": "image/jpeg",
        "file_size": 204800,
        "display_order": 0
      }
    ]
  }
}
```

**Ghi chú:**
- File được upload lên Cloudinary.
- Sau khi lưu DB, server emit `message:new` vào room Socket.IO tương ứng.

---

## 5. Friends

### 5.1 Gửi lời mời kết bạn

```
POST /api/friends/send-request
```

**Middleware:** `protectRoute`

**Request body:**

```json
{
  "receiverId": "uuid"
}
```

**Response `201 Created`:**

```json
{
  "message": "Friend request sent successfully",
  "data": {
    "id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "status": "pending"
  }
}
```

**Response `400 Bad Request`:**

```json
{
  "message": "Could not send friend request",
  "error": "You are already friends with this user"
}
```

**Ghi chú:**
- Không thể gửi cho chính mình.
- Không thể gửi nếu đã là bạn hoặc đang có pending request (theo cả 2 chiều).
- Unique index `idx_unique_pending_pair` ngăn race condition.

---

### 5.2 Chấp nhận / Từ chối lời mời

```
POST /api/friends/response-request
```

**Middleware:** `protectRoute`

**Request body:**

```json
{
  "senderId": "uuid",
  "action": "accepted"
}
```

`action` có thể là: `"accepted"` hoặc `"rejected"`

**Response `200 OK`:**

```json
{
  "message": "Friend request response recorded successfully",
  "data": { "id": "uuid" }
}
```

**Ghi chú:**
- Nếu `accepted`: xóa friend_request, tạo friendship với `user_id1 < user_id2`.
- Nếu `rejected`: chỉ xóa friend_request.
- Toàn bộ thực hiện trong transaction.

---

### 5.3 Hủy lời mời đã gửi

```
POST /api/friends/cancel-request
```

**Middleware:** `protectRoute`

**Request body:**

```json
{
  "receiverId": "uuid"
}
```

**Response `200 OK`:**

```json
{
  "message": "Friend request canceled successfully",
  "data": { "id": "uuid" }
}
```

---

### 5.4 Lấy danh sách bạn bè

```
GET /api/friends
```

**Middleware:** `protectRoute`

**Response `200 OK`:**

```json
{
  "message": "Friends retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "username": "manhdung",
      "avatar_url": "https://..."
    }
  ]
}
```

---

### 5.5 Lấy lời mời kết bạn nhận được

```
GET /api/friends/pending-requests
```

**Middleware:** `protectRoute`

**Response `200 OK`:**

```json
{
  "message": "Pending friend requests retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "username": "nguoidungA",
      "avatar_url": "https://...",
      "created_at": "2026-08-05T10:00:00.000Z"
    }
  ]
}
```

---

### 5.6 Lấy lời mời kết bạn đã gửi

```
GET /api/friends/my-requests
```

**Middleware:** `protectRoute`

**Response `200 OK`:**

```json
{
  "message": "My friend requests retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "receiver_id": "uuid",
      "username": "nguoidungB",
      "avatar_url": "https://...",
      "status": "pending",
      "created_at": "2026-08-05T11:00:00.000Z"
    }
  ]
}
```

---

### 5.7 Xóa bạn bè (Unfriend)

```
DELETE /api/friends/delete-friend
```

**Middleware:** `protectRoute`

**Request body:**

```json
{
  "friendId": "uuid"
}
```

**Response `200 OK`:**

```json
{
  "message": "Friend deleted successfully",
  "data": { "id": "uuid" }
}
```

**Response `404 Not Found`:**

```json
{
  "message": "Friend not found"
}
```

---

## 6. Recommendations

### 6.1 Lấy gợi ý kết bạn

```
GET /api/recommendations
```

**Middleware:** `protectRoute`

**Response `200 OK`:**

```json
{
  "message": "Recommendations retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "username": "nguoidungC",
      "avatar_url": "https://...",
      "is_online": true,
      "score": 42.5
    }
  ]
}
```

**Ghi chú:**
- Trả tối đa 10 gợi ý.
- Loại trừ bạn bè hiện có và pending requests.
- Score dựa trên: mutual friends (log-weighted) + mutual groups (size-weighted) + recent interactions.
- Online boost nhỏ (+3) không áp đảo static score.
- Cache Redis TTL 24h; recompute mỗi 2h bằng cron.
- Fallback nếu cache trống: trả user mới nhất.

---

## 7. Socket.IO

### Kết nối

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  withCredentials: true, // Bắt buộc để gửi cookie jwt
});
```

### Events

#### `getOnlineUsers` — Server emit

Server broadcast khi có user connect / disconnect.

**Payload:**

```json
["uuid-1", "uuid-2", "uuid-3"]
```

---

#### `heartbeat` — Client emit

Client gửi định kỳ (khuyến nghị 25s/lần) để giữ trạng thái online.

**Payload:** Không có.

---

#### `presence:sync` — Client emit

Client gửi ngay sau khi connect để lấy snapshot danh sách online hiện tại. Chỉ emit về cho chính socket đó.

**Payload:** Không có.

---

#### `conversation:join` — Client emit

Tham gia Socket.IO room của một conversation.

**Payload:**

```json
"uuid-conversation-id"
```

**Callback:**

```json
{ "success": true }
```

Hoặc lỗi:

```json
{ "success": false, "message": "You are not a member of this conversation" }
```

---

#### `conversation:leave` — Client emit

Rời Socket.IO room của một conversation.

**Payload:**

```json
"uuid-conversation-id"
```

---

#### `conversation:new` — Server emit

Server push vào room `user:{userId}` khi user được thêm vào một conversation mới (private chat được tạo hoặc được mời vào group).

**Payload:**

```json
{ "conversationId": "uuid" }
```

---

#### `message:send` — Client emit

Gửi tin nhắn qua Socket.IO (realtime, không cần gọi REST).

**Payload:**

```json
{
  "clientOffset": "client-unique-id-abc",
  "conversationId": "uuid",
  "content": "Xin chào!"
}
```

**Callback thành công:**

```json
{
  "success": true,
  "listErr": [],
  "data": {
    "id": "uuid",
    "server_offset": 7,
    "sender_id": "uuid",
    "conversation_id": "uuid",
    "content": "Xin chào!",
    "message_type": "text",
    "created_at": "2026-08-06T10:00:00.000Z"
  }
}
```

**Callback lỗi:**

```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

---

#### `message:new` — Server emit

Server push tin nhắn mới tới toàn bộ members trong room conversation.

**Payload:** Object message (cùng cấu trúc với data từ `message:send` callback).

---

## 8. Middlewares quan trọng

| Middleware | Dùng tại | Mô tả |
|---|---|---|
| `protectRoute` | Mọi route cần auth | Xác thực JWT từ cookie, gán `req.userId`, `req.email` |
| `socketAuth` | Socket.IO connection | Xác thực JWT cho socket, gán `socket.userId` |
| `checkConversationMember` | Conv routes, Message routes | Kiểm tra user có thuộc conversation không |
| `checkGroupAdmin` | Admin-only routes | Kiểm tra user có role `admin` trong group không |
| `checkGroupMemberLimit` | Add members route | Kiểm tra số lượng thành viên không vượt giới hạn |
| `verifySignup` | Signup route | Kiểm tra username/email chưa tồn tại |
| `validate` | Các route có validation rule | Chạy express-validator và trả lỗi nếu invalid |
