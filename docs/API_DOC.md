# API DOC Web Chat Realtime

Tài liệu này mô tả các endpoint REST API đang có trong backend hiện tại. Các endpoint chưa được mount hoặc mới ở mức định hướng được ghi chú riêng để tránh nhầm với contract đang chạy thật.

## 1. Thông tin chung
- Base URL: `/api`
- Auth: cookie httpOnly `jwt`
- Content-Type: `application/json`
- Frontend cần dùng `withCredentials: true`

## 2. Authentication
### 2.1 `POST /api/auth/signup`
Tạo tài khoản mới.

Request body:

```json
{
  "username": "manhdung",
  "email": "manh@example.com",
  "password": "Password123"
}
```

Response `201`:

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

### 2.2 `POST /api/auth/login`
Đăng nhập bằng email và password.

Request body:

```json
{
  "email": "manh@example.com",
  "password": "Password123",
  "rememberMe": false
}
```

Response `201`:

```json
{
  "message": "Login successfully",
  "user": {
    "id": "uuid",
    "username": "manhdung",
    "email": "manh@example.com"
  }
}
```

### 2.3 Logout
`POST /api/auth/logout`

Controller logout đã có trong code, nhưng route hiện tại chưa được mount vào server nên chưa phải API đang chạy.

## 3. User
### 3.1 `GET /api/user/me`
Lấy hồ sơ người dùng hiện tại.

Response `200`:

```json
{
  "id": "uuid",
  "username": "manhdung",
  "email": "manh@example.com",
  "avatar_url": "https://..."
}
```

### 3.2 `GET /api/user/search?id=user_id&keyword=manh`
Tìm người dùng theo `username`.

Query params:

- `id`: id của user hiện tại để loại trừ khỏi kết quả
- `keyword`: chuỗi tìm kiếm

Response `200`:

```json
[
  {
    "id": "uuid",
    "username": "manhdung",
    "avatar_url": "https://..."
  }
]
```

## 4. Conversations
### 4.1 `GET /api/conversations`
Lấy toàn bộ conversation mà user đang tham gia.

Response `200` là một mảng object, ví dụ:

```json
[
  {
    "id": "uuid",
    "type": "private",
    "name": null,
    "last_message_at": "2026-07-02T10:00:00.000Z",
    "last_message_sender_id": "uuid",
    "last_message_id": "uuid",
    "unread_count": 3,
    "last_message_content": "hello",
    "last_message_type": "text",
    "partner_id": "uuid",
    "partner_username": "manh",
    "partner_avatar": "https://..."
  }
]
```

### 4.2 `POST /api/conversations/private`
Tạo hoặc lấy conversation cá nhân theo `partnerId`.

Request body:

```json
{
  "partnerId": "uuid"
}
```

Response `200` khi conversation đã tồn tại:

```json
{
  "message": "Chat already exists",
  "result": {
    "conversationId": "uuid",
    "created": false
  }
}
```

Response `201` khi conversation mới được tạo:

```json
{
  "message": "Private chat created successfully",
  "result": {
    "conversationId": "uuid",
    "created": true
  }
}
```

### 4.3 `POST /api/conversations/groups`
Tạo group chat.

Request body:

```json
{
  "groupName": "Team Webchat",
  "membersId": ["uuid-1", "uuid-2"]
}
```

Response `201`:

```json
{
  "message": "Group chat created successfully",
  "result": {
    "conversationId": "uuid",
    "created": true
  }
}
```

### 4.4 `POST /api/conversations/groups/members`
Thêm thành viên vào group.

Request body:

```json
{
  "conversation_id": "uuid",
  "membersId": ["uuid-3", "uuid-4"]
}
```

Response `200`:

```json
{
  "message": "Members added successfully",
  "result": []
}
```

### 4.5 `GET /api/conversations/groups/search?q=web`
Tìm group theo tên.

Query params:

- `q` hoặc `name`

Response `200`:

```json
{
  "message": "Search group successfully",
  "result": []
}
```

## 5. Messages
### 5.1 `GET /api/messages?conversationId=uuid`
Lấy danh sách message theo conversation.

Query params hiện đang được controller dùng:

- `conversationId`: id conversation

Response `200`:

```json
[
  {
    "id": "uuid",
    "server_offset": 1,
    "content": "Hello",
    "message_type": "text",
    "file_url": null,
    "file_name": null,
    "sender_id": "uuid",
    "created_at": "2026-07-02T10:00:00.000Z",
    "is_deleted": false,
    "sender_username": "manhdung",
    "sender_avt": "https://..."
  }
]
```

### 5.2 `POST /api/messages`
Gửi message mới.

Request body hiện được controller nhận:

```json
{
  "conversationId": "uuid",
  "content": "Hello",
  "messageType": "text",
  "fileUrl": null,
  "fileName": null,
  "clientOffset": "client-unique-id"
}
```

Response `201`:

```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "server_offset": 1,
    "sender_id": "uuid",
    "conversation_id": "uuid",
    "content": "Hello",
    "message_type": "text",
    "file_url": null,
    "file_name": null,
    "created_at": "2026-07-02T10:00:00.000Z"
  }
}
```

Lưu ý:

- Logic hiện tại ưu tiên `content` và `clientOffset`.
- Các field `messageType`, `fileUrl`, `fileName` đã có ở request nhưng chưa được dùng đầy đủ trong service hiện tại.

## 6. Socket.IO events
### 6.1 Kết nối
Client kết nối với `withCredentials: true` để gửi cookie `jwt`.

### 6.2 `getOnlineUsers`
Backend broadcast danh sách user online hiện tại.

Payload là mảng userId:

```json
["uuid-1", "uuid-2"]
```

### 6.3 `conversation:join`
Tham gia room theo conversation.

```json
"uuid"
```

### 6.4 `conversation:leave`
Rời room conversation.

```json
"uuid"
```

### 6.5 `message:send`
Gửi tin nhắn realtime.

Payload:

```json
{
  "clientOffset": "client-unique-id",
  "conversationId": "uuid",
  "senderId": "uuid",
  "content": "Hello"
}
```

Callback thành công:

```json
{
  "success": true,
  "listErr": [],
  "data": {}
}
```

### 6.6 `message:new`
Backend emit message mới cho room conversation.

Payload là object message vừa được tạo.

## 7. Ghi chú hợp đồng API
- Các route đều đang được mount dưới prefix `/api` trong [`be/src/config/server.config.js`](../be/src/config/server.config.js).
- Cookie `jwt` được set bởi backend và đọc bởi middleware auth.
- Một số endpoint trong SRS gốc như upload, seen, typing, notification chưa có route HTTP riêng ở backend hiện tại.
