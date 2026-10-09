# BACKLOG — Ivanix Web Chat Realtime

Tài liệu này tập hợp toàn bộ:
1. **Tính năng cũ đã có UI/API nhưng còn thiếu/lỗi logic** (bug, incomplete flow)
2. **Tính năng mới chưa được làm** (backlog mở rộng)

> **Lưu ý:** Đây KHÔNG phải SRS. Các yêu cầu đã hoàn chỉnh xem tại `SRS_Webchat_realtime.md`. API contract xem tại `API_DOC.md`.

---

## Mục lục

- [A. Tính năng cũ — Còn thiếu/lỗi logic](#a-tính-năng-cũ--còn-thiếulỗi-logic)
- [B. Tính năng mới — Backlog mở rộng](#b-tính-năng-mới--backlog-mở-rộng)

---

## A. Tính năng cũ — Còn thiếu/lỗi logic

### A1. Unread Count — Reset phía client nhưng KHÔNG đồng bộ server (edge case)

**Vị trí:** `Chat.jsx` → `handleSelectConversation`

**Hiện trạng:**
```js
// Chat.jsx ~L196
setConversations((prevConvs) =>
  prevConvs.map((c) =>
    conv.id === c.id ? { ...conv, unread_count: 0 } : c,
  ),
);
```

**Phân tích chi tiết:**
- `unread_count` reset về `0` trong React state ngay khi click.
- Server ĐÃ có logic reset trong `message.service.js` → `getMessages`:
  ```js
  UPDATE conversation_members SET unread_count = 0 WHERE conversation_id = $1 AND user_id = $2
  ```
- Thực tế: mỗi lần `selectedConversation` thay đổi, `fetchMessages` được gọi ngay → server reset OK.
- **Edge case còn lại:** Nếu user click conversation rồi navigate sang tab khác trước khi `fetchMessages` hoàn thành → server chưa reset nhưng client đã reset 0. Reload trang sẽ thấy lại unread cũ.

**Cần làm:**
- Đảm bảo `fetchMessages` luôn hoàn thành trước khi UI hiển thị "đã đọc".
- Hoặc thêm API call `POST /api/conversations/read` riêng biệt khi click conversation.

---

### A2. Online Status trên Card Bạn Bè — ✅ ĐÃ SỬA

**Vị trí:** `Contacts.jsx` → danh sách bạn bè

**Hiện trạng thực tế:**
```jsx
// Contacts.jsx ~L248 — code hiện tại
<span
  className={`contacts-status-dot ${isUserOnline(friend.id) ? 'online' : 'offline'}`}
/>
```

**Kết luận:** `SocketContext` đã được import, `isUserOnline` đã được dùng đúng. **BACKLOG cũ ghi sai trạng thái.**

---

### A3. Nút "Xóa bạn bè" — ✅ ĐÃ HOÀN CHỈNH

**Vị trí:** `Contacts.jsx`

**Hiện trạng thực tế:**
- Backend: `DELETE /api/friends/delete-friend` nhận `{ friendId }` → **đã có**.
- Frontend: `openDeleteModal` → `ConfirmModal` → `handleDeleteFriend` → `friendService.deleteFriend` → `bumpRefresh()` → **đã đầy đủ**.

**Kết luận:** Hoàn chỉnh. **BACKLOG cũ ghi sai.**

---

### A4. Filter Danh sách Bạn bè — `activeFilter` state thừa, không có logic

**Vị trí:** `Contacts.jsx` → filter pills

**Hiện trạng thực tế:**
```jsx
// Contacts.jsx ~L217 — chỉ còn 1 button filter duy nhất
<button className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
  onClick={() => setActiveFilter('all')}>Tất cả</button>
```

**Vấn đề:** `activeFilter` state tồn tại nhưng không áp dụng bất kỳ logic lọc nào. Các filter "Gần đây" và "Yêu thích" đã bị xóa khỏi UI.

**Cần làm:**
- Xóa `activeFilter` state (cleanup) nếu không kế hoạch mở rộng.
- Hoặc thêm filter "Online" — lọc bạn bè đang online, có thể làm ngay vì `isUserOnline` đã có.

---

### A5. Online Dot trong Chat Header — ✅ ĐÃ SỬA

**Vị trí:** `Chat.jsx` → chat header

**Hiện trạng thực tế:**
```jsx
// Chat.jsx ~L321-324, ~L433
const isSelectedPartnerOnline = selectedPartnerId
  ? isUserOnline(selectedPartnerId)
  : false;
<span className={`online-dot ${isSelectedPartnerOnline ? "online" : "offline"}`} />
```

**Kết luận:** Đã dùng `isUserOnline` từ `SocketContext`. **BACKLOG cũ ghi sai.**

---

### A6. Message Seen — Bảng `message_seen` tồn tại nhưng không được dùng

**Vị trí:** Backend + Frontend

**Hiện trạng:**
- Bảng `message_seen (message_id, user_id, seen_at)` có trong schema SQL.
- Không có bất kỳ code nào (service, controller, route) đọc/ghi bảng này.
- Frontend không có UI hiển thị ai đã xem.

**Cần làm:**
- **Backend:** Ghi `message_seen` khi user gọi `getMessages` (có thể batch insert tin nhắn chưa seen).
- **Backend:** API `GET /api/messages/seen?conversationId=` trả danh sách seen.
- **Frontend:** Avatar nhỏ / tick xanh dưới tin nhắn cuối.
- **Nâng cao:** Socket.IO event `message:seen` broadcast realtime.

---

### A7. Typing Indicator — Chưa có

**Vị trí:** Frontend chat input + Backend socket

**Hiện trạng:** Không có bất kỳ socket event hay UI nào liên quan đến typing.

**Cần làm:**
- **Frontend:** Khi user gõ, emit `typing:start { conversationId }`. Debounce emit `typing:stop` sau ~2s.
- **Backend socket:** Thêm handler trong `message.socket.js`, broadcast `typing:start/stop` vào room, loại trừ socket người gửi.
- **Frontend:** Nhận event, hiển thị `"[Tên] đang gõ..."` animation.

---

### A8. Socket `message:send` — Cần kiểm tra sender info với group chat

**Vị trí:** `message.socket.js` → `message.service.js → newMessage`

**Hiện trạng:**
```js
// message.service.js — trả về sender info
return { ...message, ...userRows[0] }; // userRows[0] = { sender_username, sender_avt }
```

**Vấn đề còn tồn tại:**
- Khi `ON CONFLICT DO NOTHING` (duplicate `client_offset`), service query lại và join `users` → có `sender_username/sender_avt` — **OK**.
- **Cần test thực tế** với group chat nhiều người: xác nhận `sender_avt` luôn có trong payload socket emit để render avatar đúng.

---

### A9. `conversation:new` FE listener — ✅ ĐÃ HOÀN CHỈNH

**Vị trí:** `Chat.jsx`

**Hiện trạng thực tế:**
```js
// Chat.jsx ~L162-186
socket.on("conversation:new", handleNewConversation);
// Handler: fetch lại getAllConversations, thêm vào state, join socket room
```

**Kết luận:** Đã hoàn chỉnh. **BACKLOG cũ ghi sai.**

---

### A10. Delete Message — Schema có sẵn nhưng chưa có API/UI

**Vị trí:** Backend + Frontend

**Hiện trạng:**
- Schema có `is_deleted BOOLEAN DEFAULT FALSE`, `deleted_at TIMESTAMP`, constraint `chk_deleted`.
- `getMessages` đã filter `AND m.is_deleted = FALSE`.
- **Chưa có** endpoint soft-delete message.
- **Chưa có** UI context menu / nút thu hồi.

**Cần làm:**
- **Backend:** `DELETE /api/messages/:id` → set `is_deleted = true, deleted_at = NOW()`. Middleware: `sender_id = req.userId`.
- **Backend socket:** Emit `message:deleted { messageId, conversationId }` vào room.
- **Frontend:** Context menu trên bubble của mình → "Thu hồi tin nhắn".
- **Frontend:** Replace bubble bằng "_Tin nhắn đã bị thu hồi_" khi nhận `message:deleted`.

---

### A11. Notifications Page — `/notifications` tồn tại nhưng hoàn toàn trống

**Vị trí:** `Notification.jsx`

**Hiện trạng:**
```jsx
// Notification.jsx — toàn bộ nội dung
export default function Notification() { return <div></div>; }
```

**Cần làm — Phân cấp:**
- **Level 1 — Browser Notification (easy):** Khi nhận `message:new` và tab không active → dùng `Notification API`.
- **Level 2 — In-App:** Socket event `friend:request`, `friend:accepted`. Bell badge trên Sidebar. Page `/notifications` liệt kê.

---

### A12. Add Member vào Group — Không emit socket cho member vừa được thêm

**Vị trí:** `conversation.controller.js` → `addNewMembers`

**Hiện trạng:**
```js
// conversation.controller.js ~L48-60
const addNewMembers = async (req, res) => {
  const result = await convService.addNewMembers(conversationId, membersId);
  res.status(200).json({ message: "Members added successfully", result });
  // ❌ KHÔNG có io.emit()
};
```

**So sánh — `newGroupChat` đã có:**
```js
membersId.forEach((memberId) => {
  io.to(`user:${memberId}`).emit("conversation:new", { conversationId: result.conversationId });
});
```

**Vấn đề:** Member mới được thêm không nhận `conversation:new` → conversation không tự xuất hiện trên sidebar của họ.

**Cần làm:**
```js
// Sau khi addNewMembers thành công:
membersId.forEach((memberId) => {
  io.to(`user:${memberId}`).emit("conversation:new", { conversationId });
});
```

---

### A13. Settings — Toggle "Thông báo" và "Dark Mode" chỉ là UI, không có logic

**Vị trí:** `Settings.jsx` → "Tùy Chọn Khác"

**Hiện trạng:**
```jsx
// Settings.jsx ~L222, ~L237
<input type="checkbox" defaultChecked />  // không có state, không có handler
```

**Vấn đề:** Thay đổi không được lưu ở đâu cả (không `localStorage`, không server).

**Cần làm:**
- **Dark Mode:** `localStorage` preference + toggle `data-theme="dark"` trên `:root`.
- **Thông báo:** Check `Notification.permission` + `requestPermission()` khi bật + lưu preference.

---

### A14. Recommendation Engine — `computeStaticFeatures` chưa có cron schedule

**Vị trí:** `recommendation.service.js`

**Hiện trạng:**
- `computeStaticFeatures()` hoàn chỉnh về logic (mutual friends, mutual groups, interactions).
- **Chưa có cron job nào gọi nó** — hàm không bao giờ được chạy trong production.
- `getRecommendations` có fallback khi Redis cache trống (trả về user mới nhất), nhưng feature score không bao giờ được tính.

**Cần làm:**
- Thêm `node-cron` hoặc `setInterval` trong `server.js` / `cron.js` để gọi `computeStaticFeatures()` định kỳ (mỗi 6-24 giờ).
- Có thể gọi một lần khi server khởi động.

---

### A15. Messages — Pagination tồn tại ở service nhưng bị bỏ qua hoàn toàn

**Vị trí:** `message.service.js` → `getMessages` + `message.controller.js` + `Chat.jsx`

**Hiện trạng:**
```js
// message.service.js — signature hỗ trợ pagination
const getMessages = async (conversationId, user_id, beforeOffset = null, limit = 20) => { ... }

// message.controller.js — KHÔNG truyền beforeOffset
const messages = await messService.getMessages(conversationId, userId);
// → luôn dùng default: beforeOffset=null, limit=20

// Chat.jsx — KHÔNG truyền params
const msgs = await messService.getMessages(selectedConversation.id);
```

**Vấn đề:** Conversation nhiều tin nhắn chỉ hiển thị 20 tin mới nhất. User không thể load thêm tin cũ.

**Cần làm:**
- **Backend controller:** Đọc `req.query.before` và `req.query.limit`, truyền vào service.
- **Frontend service/API:** Truyền `before` (server_offset cursor) và `limit`.
- **Frontend UI:** Intersection observer khi scroll lên đầu → load thêm.
- **Frontend state:** Prepend tin cũ, giữ scroll position.

---

## B. Tính năng mới — Backlog mở rộng

### B1. Block User (Chặn người dùng)

**Backend:**
- Bảng mới `user_blocks (blocker_id UUID, blocked_id UUID, created_at)`.
- Middleware kiểm tra block trước khi gửi tin nhắn / friend request.
- Loại excluded users khỏi `user.service.js → search`.

**Frontend:**
- Menu context → Block.
- Hiển thị "Bị chặn" khi cố chat.

---

### B2. Message Reactions (Emoji Reactions)

**Backend:**
- Bảng `message_reactions (message_id, user_id, emoji, created_at)`.
- `POST /api/messages/:id/reactions`, `DELETE /api/messages/:id/reactions`.
- Socket event `message:reaction` broadcast vào room.

**Frontend:**
- Hover bubble → emoji picker.
- Reaction count dưới bubble, update realtime.

---

### B3. Message Search trong Hội thoại

**Backend:**
- `GET /api/messages/search?conversationId=&q=` — full-text search dùng `pg_trgm` (đã enable).

**Frontend:**
- Search bar trong chat header (icon tìm kiếm đã có layout).
- Highlight kết quả, scroll đến tin nhắn.

---

### B4. Pin Message (Ghim tin nhắn)

**Backend:**
- Cột `pinned_message_id UUID FK → messages(id)` trong `conversations`.
- `PUT /api/conversations/:id/pin`.

**Frontend:**
- Banner tin nhắn ghim trên chat header.
- Click scroll đến tin nhắn.

---

### B5. Voice/Audio Message

**Backend:**
- Mở rộng `message_type` CHECK thêm `'audio'`.
- Upload audio lên Cloudinary qua `upload.service.js`.

**Frontend:**
- Nút ghi âm (MediaRecorder API).
- Audio player trong bubble.

---

### B6. User Status / Bio

**Backend:**
- Cột `status_text VARCHAR(100)` trong `users`.
- Cập nhật `PUT /api/user/profile`.

**Frontend:**
- Input trong `Settings.jsx`.
- Hiển thị dưới username.

---

### B7. Group Avatar

**Backend:**
- Cột `avatar_url TEXT` trong `conversations`.
- `PUT /api/conversations/groups/avatar`.

**Frontend:**
- Hiển thị trong sidebar (hiện dùng `<Users />` icon cho group).
- Upload form trong `ChatInfo.jsx`.

---

### B8. Read Receipts Realtime (nâng cao A6)

**Backend:**
- Ghi `message_seen` khi `getMessages` được gọi.
- Socket event `message:seen { messageId, userId, seenAt }` broadcast vào room.

**Frontend:**
- Avatar người đã đọc dưới tin nhắn cuối, update realtime.

---

### B9. Starred / Favorite Messages

**Backend:**
- Bảng `starred_messages (user_id, message_id, starred_at)`.
- `POST /api/messages/:id/star`, `DELETE /api/messages/:id/star`, `GET /api/messages/starred`.

**Frontend:**
- Menu context → Star message.
- Tab "Starred" trong ChatInfo resource section.

---

### B10. Multi-language Support (i18n)

**Frontend:**
- `react-i18next`, language switcher trong `Settings.jsx`.
- Externalize toàn bộ string UI vào file `.json`.

---

### B11. Dark Mode / Theme Switcher — UI có sẵn, cần implement (xem A13)

**Frontend:**
- CSS custom properties đã có → toggle `data-theme="dark"` trên `:root`.
- Toggle UI trong `Settings.jsx` đã có nhưng thiếu logic.
- Lưu preference vào `localStorage`.

---

### B12. Presence Persistence cho Recommendation

**Mô tả:** Tính online boost chính xác hơn bằng lịch sử active time.

**Cần làm:**
- Lưu lịch sử `active_hours` vào Redis/Postgres.
- Dùng `avg_daily_active_hours` làm thêm signal trong `staticScore` (recommendation.service.js).

---

## Ưu tiên đề xuất

| Mức độ | Items |
|--------|-------|
| 🔴 **Critical (bug logic thực tế)** | A12 (addMember không emit socket), A14 (cron recommendation chưa chạy), A15 (pagination bị bỏ qua hoàn toàn) |
| 🟠 **High (tính năng dở dang, UX bị vỡ)** | A10 (delete message — schema có sẵn), A7 (typing indicator), A11 (notifications page trống) |
| 🟡 **Medium (cần hoàn thiện)** | A6 (message seen — bảng có sẵn), A13 (settings toggle không lưu), A1 (unread edge case) |
| 🟢 **Low (cleanup/cải thiện nhỏ)** | A4 (activeFilter thừa), A8 (test edge case sender info) |
| 🔵 **New Feature** | B8 > B2 > B3 > B1 > B5 > B4 > B7 > B6 > B9 |

---

## Ghi chú — Items đã hoàn chỉnh so với BACKLOG cũ

| Item cũ | Trạng thái thực tế sau khi đọc code |
|---------|--------------------------------------|
| A2 (Online dot Contacts hardcode) | ✅ Đã sửa — `isUserOnline(friend.id)` đang được dùng |
| A3 (Nút xóa bạn bè FE thiếu logic) | ✅ Đã sửa — `ConfirmModal` + `deleteFriend` + `bumpRefresh` hoàn chỉnh |
| A5 (Online dot Chat header hardcode) | ✅ Đã sửa — `isSelectedPartnerOnline` từ `SocketContext` |
| A9/A12 cũ (conversation:new FE chưa listen) | ✅ Đã sửa — handler `handleNewConversation` trong `Chat.jsx` |
| A9 (checkConversationMember bị tắt) | ✅ Đã bật lại trong `message.routes.js` |
| B1 cũ (Unfriend FE thiếu) | ✅ Đã sửa — xem A3 |
'@
