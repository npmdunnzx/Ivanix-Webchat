# SRS Web Chat Realtime

## 1. Mục tiêu hệ thống
Hệ thống Web Chat Realtime là một ứng dụng chat hỗ trợ xác thực bằng JWT qua cookie, trao đổi dữ liệu REST API và realtime qua Socket.IO, lưu trữ trên PostgreSQL.

Mục tiêu nghiệp vụ của sản phẩm gồm:

- Đăng ký và đăng nhập người dùng.
- Xem hồ sơ và tìm kiếm người dùng.
- Tạo và quản lý hội thoại cá nhân / nhóm.
- Gửi và nhận tin nhắn realtime.
- Theo dõi người dùng online realtime.
- Mở rộng cho upload media, seen message, typing indicator, notification và unread count.

## 2. Phạm vi hiện tại
### 2.1 Đã hiện thực
Backend hiện tại đã có các chức năng sau:

- Authentication: signup, login.
- Lấy hồ sơ người dùng hiện tại.
- Tìm kiếm người dùng.
- Tạo / lấy danh sách conversation.
- Tạo nhóm chat.
- Thêm thành viên vào nhóm.
- Tạo hoặc lấy conversation cá nhân theo cặp người dùng.
- Lấy danh sách message theo conversation.
- Gửi message qua REST API và Socket.IO.
- Socket.IO auth bằng cookie `jwt`.
- Theo dõi danh sách user online realtime.

### 2.2 Chưa hiện thực hoặc mới ở mức định hướng
Các mục sau vẫn là định hướng nghiệp vụ hoặc chưa được mount đầy đủ trong backend:

- Upload image / file qua API riêng.
- Typing indicator.
- Seen message.
- Notification realtime.
- Persist trạng thái online / offline vào DB.
- Thu hồi tin nhắn theo luồng UI riêng.
- Sidebar realtime với sắp xếp hội thoại, unread count đồng bộ đầy đủ.

## 3. Công nghệ
- Frontend: ReactJS, Axios, Socket.IO Client.
- Backend: Node.js, Express, Socket.IO.
- Authentication: JWT trong cookie httpOnly.
- Database: PostgreSQL.
- Storage: Cloudinary hoặc dịch vụ lưu trữ file tương đương cho giai đoạn mở rộng.

## 4. Kiến trúc tổng thể
Client (React)
  -> REST API / Socket.IO
Backend (Express + Socket.IO)
  -> PostgreSQL
  -> Cloud Storage (khi có upload)

## 5. Chức năng nghiệp vụ
### 5.1 Authentication
#### Đăng ký
- Người dùng nhập `username`, `email`, `password`.
- Backend validate dữ liệu và kiểm tra trùng username / email.
- Password được hash bằng bcrypt.
- Tài khoản được lưu vào bảng `users`.
- Backend set cookie `jwt` sau khi tạo tài khoản thành công.

API hiện tại: `POST /api/auth/signup`

#### Đăng nhập
- Người dùng nhập `email`, `password` và tùy chọn `rememberMe`.
- Backend kiểm tra thông tin đăng nhập.
- Nếu hợp lệ, backend set cookie `jwt`.
- `rememberMe` quyết định thời hạn cookie.

API hiện tại: `POST /api/auth/login`

#### Đăng xuất
- Controller logout đã tồn tại.
- Route logout chưa được mount trong `server.config.js` ở thời điểm hiện tại.

### 5.2 Hồ sơ người dùng
Backend trả về hồ sơ hiện tại gồm:

- `id`
- `username`
- `email`
- `avatar_url`

API hiện tại: `GET /api/user/me`

### 5.3 Tìm kiếm người dùng
- Cho phép tìm theo `username`.
- Loại trừ chính user đang tìm.
- Kết quả giới hạn 15 bản ghi.

API hiện tại: `GET /api/user/search?id=user_id&keyword=manh`

### 5.4 Conversation cá nhân
- Khi user A chọn user B, backend kiểm tra conversation theo `participant_key`.
- Nếu đã tồn tại, trả về conversation cũ.
- Nếu chưa tồn tại, tạo conversation mới và thêm 2 member.

API hiện tại: `POST /api/conversations/private`

### 5.5 Conversation nhóm
- Tạo nhóm chat.
- Thêm thành viên vào nhóm.
- Đánh dấu admin cho người tạo nhóm.

API hiện tại:

- `POST /api/conversations/groups`
- `POST /api/conversations/groups/members`

### 5.6 Danh sách conversation
- Trả về toàn bộ conversation mà user đang tham gia.
- Bao gồm thông tin last message, partner, unread count.

API hiện tại: `GET /api/conversations`

### 5.7 Message
- Lấy danh sách message theo conversation.
- Gửi message mới và cập nhật last message của conversation.
- Tăng `unread_count` cho các member khác.
- Hỗ trợ chống gửi trùng bằng `client_offset`.

API hiện tại:

- `GET /api/messages?conversationId=...`
- `POST /api/messages`

### 5.8 Realtime / Socket.IO
- Socket auth dùng cùng cookie `jwt`.
- Khi user connect, backend cập nhật danh sách online user trong bộ nhớ.
- Khi disconnect, backend cập nhật lại danh sách online user.
- Khi join room conversation, socket tham gia room `conversation:{conversationId}`.
- Khi gửi message qua socket, backend emit `message:new` cho room tương ứng.

Socket event hiện có:

- `getOnlineUsers`
- `conversation:join`
- `conversation:leave`
- `message:send`
- `message:new`

## 6. API hiện tại
### 6.1 Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`

### 6.2 User
- `GET /api/user/me`
- `GET /api/user/search`

### 6.3 Conversations
- `GET /api/conversations`
- `POST /api/conversations/groups`
- `POST /api/conversations/groups/members`
- `POST /api/conversations/private`
- `GET /api/conversations/groups/search`

### 6.4 Messages
- `GET /api/messages`
- `POST /api/messages`

## 7. Dữ liệu và schema chính
Bảng chính hiện có trong [`be/chat.sql`](../be/chat.sql):

- `users`
- `conversations`
- `conversation_members`
- `messages`
- `message_seen`

### 7.1 users
- Lưu `username`, `email`, `password_hash`, `avatar_url`, `last_seen`.

### 7.2 conversations
- Hỗ trợ `private` và `group`.
- Có `last_message_id`, `last_message_at`, `last_message_sender_id`, `participant_key`.

### 7.3 conversation_members
- Lưu member theo conversation.
- Có `role` và `unread_count`.

### 7.4 messages
- Có `server_offset`, `client_offset`, `message_type`, `file_url`, `file_name`, `is_deleted`, `deleted_at`.

### 7.5 message_seen
- Dùng khóa chính ghép `(message_id, user_id)`.

## 8. Ghi chú triển khai quan trọng
- Cookie `jwt` hiện được set với `httpOnly`, `sameSite: None`, `secure: true`.
- Client cần bật `withCredentials: true` khi gọi API và khi kết nối Socket.IO.
- `POST /api/messages` hiện đang nhận thêm các field mở rộng, nhưng logic lưu trữ thực tế chủ yếu dùng `conversationId`, `content`, `clientOffset` và `senderId` từ cookie auth.
- `POST /api/auth/logout` có controller nhưng chưa được mount trong server.
