# Hướng Dẫn Thiết Kế UI Ivanix Webchat

Tài liệu này là hướng dẫn UI/UX chính thức cho dự án `Ivanix Webchat`. Mục tiêu là chuẩn hóa màu sắc, chữ, bố cục, quy tắc component và cách tổ chức UI để mọi dev FE, người thiết kế UI/UX và người review có cùng một nguồn tham chiếu khi xây dựng giao diện cho toàn bộ ứng dụng:

- `fe/src/pages/AuthPage.jsx` — Đăng nhập / Đăng ký
- `fe/src/pages/Chat.jsx` — Nhắn tin realtime
- `fe/src/pages/Contacts.jsx` — Danh bạ / Kết bạn
- `fe/src/pages/Storage.jsx` — Lưu trữ
- `fe/src/components/Sidebar.jsx` — Thanh điều hướng chính
- `fe/src/components/ChatInfo.jsx` — Panel thông tin hội thoại
- `fe/src/components/LayoutPage.jsx` — Layout shell
- `fe/src/components/UserInfo.jsx` — Card thông tin thành viên

Hướng dẫn này ưu tiên phong cách **sáng, chuyên nghiệp và hiện đại**: nền xám trung tính sáng, bề mặt trắng sạch, chữ rõ ràng, **teal đại dương** làm màu nhấn chính, **cyan sáng** làm màu nhấn phụ và đen xám chỉ dùng khi cần chiều sâu. Mọi giao diện mới cần bám theo hệ thống này để tạo cảm giác đồng bộ, tin cậy và dễ sử dụng.

---

## 1. Định Hướng Thiết Kế

### 1.1 Tinh thần thương hiệu

Ivanix là ứng dụng webchat realtime hướng đến trải nghiệm giao tiếp nhanh, trực quan và đáng tin cậy. UI cần tạo cảm giác:

- Sáng, sạch, dễ đọc — tập trung vào nội dung tin nhắn.
- Có chiều sâu chuyên nghiệp nhưng không tối nặng toàn trang.
- Hành động chính (gửi tin nhắn, thêm bạn, tạo nhóm) rõ ràng, không bị cạnh tranh bởi quá nhiều màu mạnh.
- Layout đủ thoáng để danh sách hội thoại, bong bóng tin nhắn và panel thông tin thở.
- Không giống giao diện mẫu hoặc giao diện do AI tạo đại trà: tránh gradient vô nghĩa, card lồng card, bóng đổ quá tay, hiệu ứng thừa.

Từ khóa nhận diện:

| Từ khóa | Ý nghĩa khi triển khai UI |
|---|---|
| Tin cậy | Giao diện ổn định, khoảng trắng rộng, trạng thái rõ ràng |
| Hiện đại | Bố cục rõ, bo góc mềm, chuyển động nhẹ nhàng |
| Nhanh | Tương tác phản hồi tức thì, trạng thái gửi/nhận tin rõ ràng |
| Kết nối | Trạng thái online/offline trực quan, danh bạ/gợi ý bạn bè |
| Tối giản | Không trang trí quá mức, không thêm màu/hình khối không có vai trò |
| Chuyên nghiệp | Teal đại dương dùng tiết chế, chữ chắc, bóng đổ mềm |

### 1.2 Ưu tiên nền sáng, nhấn bằng chiều sâu

Giao diện chính dùng nền sáng. Nền tối và hiệu ứng kính chỉ dùng có chủ đích:

- Trang đăng nhập/đăng ký: nền ảnh full viewport với overlay tối và panel form sáng/tối tùy bên.
- Chat header có thể dùng backdrop-filter blur nhẹ.
- Sidebar active item dùng nền teal đậm.
- Tin nhắn của mình dùng nền teal đậm, tin nhắn của người khác dùng nền trắng.

Không chuyển toàn bộ ứng dụng sang chế độ tối nếu chưa có thiết kế dark mode đầy đủ.

### 1.3 Tính nhất quán thương hiệu

Mọi phần khung giao diện trong sản phẩm cần dùng token Ivanix. Khung giao diện bao gồm sidebar, chat header, message input, channel list, contact card, form đăng nhập/đăng ký, modal, toast, panel thông tin hội thoại và trạng thái rỗng.

Avatar người dùng, ảnh được gửi qua tin nhắn và ảnh upload được phép có bảng màu riêng. Tuy vậy, chữ phủ trên ảnh, control, CTA và trạng thái tương tác đặt trên các visual đó vẫn phải dùng token trong hướng dẫn này để đảm bảo độ tương phản và tính nhất quán.

### 1.4 Định hướng thị giác

Định hướng thị giác chuẩn:

- Nền sáng chủ đạo (xám trung tính nhẹ), sạch và chuyên nghiệp.
- Nhấn bằng teal đại dương và cyan sáng, không dùng màu neon/tím/cam làm màu UI chính.
- Bố cục thoáng, dễ scan, ưu tiên khoảng trắng thay vì thêm khung trang trí.
- Card trắng/xám nhạt, border nhẹ, shadow mềm; không dùng shadow đen nặng trên nền sáng.
- Các chi tiết teal nên xuất hiện như nút active, icon nhấn, vòng focus, badge thương hiệu.
- Cyan sáng dùng cho text glow, heading đặc biệt trên trang auth.

---

## 2. Nguyên Tắc Cốt Lõi

- **Một hệ màu duy nhất:** xám trung tính, trắng, teal đại dương, cyan sáng, đen xám.
- **CTA chính rõ nhất:** mỗi màn hình chỉ nên có một hành động chính nổi bật nhất.
- **Không lạm dụng card:** card dùng cho item lặp lại (hội thoại, contact, search result), không bọc card cho mọi section.
- **Không card trong card:** nếu cần chia nhóm trong card, dùng divider/spacing/heading nhỏ.
- **Responsive từ đầu:** component phải tự ổn trên mobile, không vá riêng từng trang sau cùng.
- **Trạng thái focus bắt buộc:** nút, link, input, dropdown và card click được phải có focus nhìn thấy.
- **Dữ liệu bất đồng bộ phải có trạng thái:** đang tải, rỗng, lỗi, vô hiệu hóa, thành công.
- **Icon một hệ:** dùng `lucide-react` cho UI icon, `react-icons` chỉ cho icon auth (MdEmail, MdLock, MdPerson).
- **Ảnh có vai trò thật:** avatar phải có fallback, không dùng placeholder xám trống.
- **Không thêm màu tùy ý:** nếu cần màu mới, thêm vào token trước rồi mới dùng.

---

## 3. Hệ Màu Thương Hiệu

Hệ màu cốt lõi của Ivanix:

| Màu | HEX | Vai trò |
|---|---|---|
| Teal đại dương | `#123A4A` | Màu chính, sidebar icon, nút active, tin nhắn mình, CTA |
| Cyan sáng | `#67E8F9` | Heading thương hiệu, glow, text shadow đặc biệt trên auth |
| Teal xanh lá | `#0F766E` | Nút đăng nhập/đăng ký, focus ring, accent auth |
| Xám nền chính | `#F6F7F9` | Nền sidebar, nền chính ứng dụng |
| Xám nền phụ | `#EEF1F4` | Nền panel tin nhắn, section phụ |
| Xám nền cao | `#E5E9EE` | Hover nhẹ, nền search input |
| Xám nền cao nhất | `#DDE3EA` | Avatar placeholder, hover rõ |
| Trắng | `#FFFFFF` | Card, tin nhắn người khác, bề mặt form |
| Trắng lạnh | `#F8FAFC` | Nền vùng chat, input background |
| Đen xám | `#111827` | Chữ chính, heading |
| Xám muted | `#64748B` | Chữ phụ, placeholder, metadata |
| Đỏ lỗi | `#EF4444` | Badge chưa đọc, nút xóa, lỗi |
| Xanh lá online | `#22C55E` | Trạng thái online |

### 3.1 Tỉ lệ màu đề xuất

| Nhóm màu | Tỉ lệ | Cách dùng |
|---|---:|---|
| Xám trung tính / trắng | 75% | Nền chính, sidebar, panel, bề mặt, khoảng thở |
| Đen xám / xám muted | 13% | Chữ chính, chữ phụ, icon, metadata |
| Teal đại dương | 10% | CTA, active state, nút gửi, sidebar active, tin nhắn mình |
| Cyan / accent | 2% | Glow, heading auth, text shadow |

### 3.2 Bảng màu chuẩn

| Token | HEX | Dùng cho |
|---|---|---|
| `--sidebar-bg` | `#F6F7F9` | Nền sidebar, nền chính trang |
| `--sidebar-bg-low` | `#EEF1F4` | Nền panel tin nhắn, contacts page |
| `--sidebar-bg-high` | `#E5E9EE` | Nền search input, hover nhẹ |
| `--sidebar-bg-highest` | `#DDE3EA` | Avatar placeholder, hover rõ hơn |
| `--sidebar-border` | `#D7DEE7` | Border chung cho card, input, divider |
| `--sidebar-text` | `#111827` | Chữ chính, heading, username |
| `--sidebar-muted` | `#64748B` | Chữ phụ, placeholder, timestamp, metadata |
| `--sidebar-primary` | `#123A4A` | CTA chính, sidebar active, tin nhắn mình, nút gửi |
| `--sidebar-error` | `#EF4444` | Badge unread, nút xóa, lỗi |
| `--color-online` | `#22C55E` | Chấm online |
| `--color-surface` | `#FFFFFF` | Card, tin nhắn người khác, bề mặt form |
| `--color-surface-cool` | `#F8FAFC` | Nền vùng chat chính |
| `--auth-primary` | `#0F766E` | Nút auth, focus ring auth |
| `--auth-primary-hover` | `#115E59` | Hover nút auth |
| `--auth-cyan-glow` | `#67E8F9` | Heading glow auth, text shadow |
| `--auth-brand-muted` | `#B9DFE1` | Subtitle auth, muted trên nền tối |

### 3.3 Token bóng đổ

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--shadow-sidebar-icon` | `0 8px 18px rgba(18, 58, 74, 0.20)` | Sidebar icon, nav active |
| `--shadow-sidebar-icon-hover` | `0 10px 22px rgba(18, 58, 74, 0.26)` | Hover sidebar icon |
| `--shadow-card` | `0 3px 10px rgba(15, 23, 42, 0.06)` | Channel active, card nhẹ |
| `--shadow-card-hover` | `0 4px 16px rgba(15, 23, 42, 0.08)` | Contact card hover |
| `--shadow-toast` | `0 8px 24px rgba(15, 23, 42, 0.14)` | Toast notification |
| `--shadow-auth-card` | `0 24px 60px rgba(15, 23, 42, 0.24)` | Auth card chính |
| `--shadow-auth-primary` | `0 10px 24px rgba(15, 118, 110, 0.24)` | Nút đăng nhập/đăng ký |
| `--shadow-message` | `0 2px 8px rgba(15, 23, 42, 0.06)` | Bong bóng tin nhắn |

### 3.4 Biến CSS chuẩn

Token nên được tập trung trong `:root` tại các file style. Hiện tại chúng nằm phân tán trong `sidebar.css` và `auth.css`. Kế hoạch chuẩn hóa nên gom vào một file `tokens.css` hoặc đầu file `layout.css`.

```css
:root {
  /* ── Nền ── */
  --sidebar-bg: #F6F7F9;
  --sidebar-bg-low: #EEF1F4;
  --sidebar-bg-high: #E5E9EE;
  --sidebar-bg-highest: #DDE3EA;
  --color-surface: #FFFFFF;
  --color-surface-cool: #F8FAFC;

  /* ── Viền ── */
  --sidebar-border: #D7DEE7;
  --color-border-soft: rgba(0, 0, 0, 0.06);

  /* ── Chữ ── */
  --sidebar-text: #111827;
  --sidebar-muted: #64748B;

  /* ── Thương hiệu ── */
  --sidebar-primary: #123A4A;
  --sidebar-primary-dark: #0D2D3A;
  --color-online: #22C55E;
  --sidebar-error: #EF4444;

  /* ── Auth ── */
  --auth-primary: #0F766E;
  --auth-primary-hover: #115E59;
  --auth-cyan-glow: #67E8F9;
  --auth-brand-bg: rgba(18, 58, 74, 0.90);
  --auth-brand-muted: #B9DFE1;
  --auth-panel-bg: rgba(255, 255, 255, 0.94);
  --auth-panel-text: #10202B;
  --auth-panel-muted: #5F7180;
  --auth-border: #D6E0E8;
  --auth-input-bg: #F8FAFC;
  --auth-placeholder: #8A98A5;
  --auth-focus: rgba(15, 118, 110, 0.22);
  --auth-tab-bg: #EEF4F6;
  --auth-tab-active-bg: #FFFFFF;

  /* ── Bóng đổ ── */
  --shadow-sidebar-icon: 0 8px 18px rgba(18, 58, 74, 0.20);
  --shadow-card: 0 3px 10px rgba(15, 23, 42, 0.06);
  --shadow-card-hover: 0 4px 16px rgba(15, 23, 42, 0.08);
  --shadow-toast: 0 8px 24px rgba(15, 23, 42, 0.14);
  --shadow-auth-card: 0 24px 60px rgba(15, 23, 42, 0.24);
  --shadow-auth-primary: 0 10px 24px rgba(15, 118, 110, 0.24);
  --shadow-message: 0 2px 8px rgba(15, 23, 42, 0.06);

  /* ── Bo góc ── */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 14px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
  --radius-pill: 999px;
  --radius-message: 18px;

  /* ── Font ── */
  --font-sans: sans-serif;
  --line-height-tight: 1.15;
  --line-height-heading: 1.2;
  --line-height-body: 1.45;
  --line-height-relaxed: 1.65;
}
```

---

## 4. Chữ

Hệ chữ cần hiện đại, dễ đọc trên UI nhiều nội dung text như tin nhắn, danh bạ, tìm kiếm và form auth. Hiện tại dùng font hệ thống `sans-serif`. Khi bổ sung font thương hiệu, ưu tiên:

| Vai trò | Font đề xuất | Cách dùng |
|---|---|---|
| Chữ thương hiệu / logo | Montserrat SemiBold / Bold | Logo "Ivanix", tiêu đề đặc biệt |
| Heading UI | Inter Bold / SemiBold | H1-H3, tiêu đề section, tiêu đề panel |
| Body UI | Inter Regular / Medium | Tin nhắn, metadata, mô tả, form input |

Bộ font dự phòng hiện tại:

```css
font-family: sans-serif;
```

| Loại chữ | Cỡ chữ | Độ đậm | Chiều cao dòng | Dùng cho |
|---|---:|---:|---:|---|
| Display | `clamp(2.25rem, 5vw, 3.5rem)` | 500 | 1.0 | Heading auth "Ivanix" |
| H1 | 28px | 700 | 1.15 | Heading trang (Danh bạ) |
| H2 | 20px | 700 | 1.2 | Heading panel (Tin nhắn), tiêu đề chat |
| H3 | 13-15px | 700 | 1.25 | Heading section (Gợi ý kết nối), username card |
| Body | 14px | 400-500 | 1.45 | Tin nhắn, mô tả |
| Small | 11-12px | 600-700 | 1.35 | Metadata, timestamp, badge, label |
| Micro | 9-10px | 600-700 | 1.4 | WORKSPACE label, email monospace, status text |
| Nút | 12-14px | 700 | 1.0 | Chữ trong nút |
| Label form | 14-15px (0.95rem) | 700 | 1.4 | Label input auth |
| Placeholder | 12px | 600 | — | Placeholder search/filter |

Quy tắc:

- Text chính trên nền sáng dùng `#111827`.
- Text phụ, caption, metadata dùng `#64748B`.
- Text trên nền tối (auth brand side, sidebar active) dùng `#FFFFFF`.
- Text trên nền tối auth (subtitle) dùng `#B9DFE1`.
- Link/action quan trọng dùng `#123A4A`.
- Body dài giới hạn khoảng 65-75 ký tự mỗi dòng.
- Không dùng letter-spacing âm.
- Label nhỏ (WORKSPACE) có thể dùng `text-transform: uppercase` và `letter-spacing: 0.08em`.
- Email trong card dùng `font-family: monospace`.

---

## 5. Khoảng Cách, Bố Cục Và Container

### 5.1 Token khoảng cách

| Token | Giá trị | Dùng cho |
|---|---:|---|
| `space-2xs` | 4px | Gap icon/text nhỏ, channel-list gap |
| `space-xs` | 8px | Gap nav-item, inline metadata |
| `space-sm` | 10-12px | Padding message input, channel-item padding |
| `space-md` | 14-16px | Padding card, gap giữa component |
| `space-lg` | 20-24px | Padding section header, card padding lớn |
| `space-xl` | 32px | Grid gap contacts |
| `space-2xl` | 48px | Padding trang contacts |

### 5.2 Quy tắc bố cục

- **Layout shell:** `display: flex; height: 100vh;` — Sidebar + Main content.
- **Sidebar:** Fixed left, `height: 100vh`, border-right.
- **Chat page:** `display: flex;` — Messages panel (320px) + Chat container (flex: 1) + Chat info (flex: 0.45).
- **Contacts page:** `margin-left: 280px;` khi sidebar mở rộng, `max-width: 1100px; margin: 0 auto;`.
- **Auth page:** `min-height: 100vh; display: flex; align-items: center; justify-content: center;`.

### 5.3 Quy tắc panel

| Panel | Desktop width | Mobile behavior |
|---|---|---|
| Sidebar (expanded) | 280px | Ẩn hoặc drawer |
| Sidebar (collapsed) | 64px | Giữ 64px |
| Messages panel | 320px → co 280px | Full width, max-height 38vh |
| Chat container | flex: 1 | height: 62vh |
| Chat info | flex: 0.45 | Ẩn hoặc drawer |
| Contacts inner | max-width: 1100px | Full width, padding 16px |

### 5.4 Quy tắc grid

- Grid danh bạ: `repeat(auto-fill, minmax(300px, 1fr))` — tự động 3→2→1 cột.
- Grid gợi ý: `repeat(auto-fill, minmax(280px, 1fr))` — tương tự.
- Grid kết quả tìm kiếm: `repeat(auto-fill, minmax(280px, 1fr))`.

---

## 6. Hệ Thống Component

### 6.1 Nút

**Nút chính (CTA)** — dùng cho hành động chính:

- Gửi tin nhắn
- Đăng nhập / Đăng ký
- Thêm bạn mới
- Nhắn tin (contact card)
- Kết nối (gợi ý bạn)

```css
.btn-primary {
  min-height: 44px;
  padding: 9px 18px;
  border: 0;
  border-radius: var(--radius-md);
  color: #FFFFFF;
  background: var(--sidebar-primary);
  font-weight: 700;
  font-size: 11-12px;
  box-shadow: var(--shadow-sidebar-icon);
  cursor: pointer;
  transition: opacity 160ms ease, transform 100ms ease;
}

.btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}
```

**Nút auth chính** — style riêng cho trang đăng nhập/đăng ký:

```css
.btn-auth {
  width: 100%;
  padding: 14px;
  border: 0;
  border-radius: 12px;
  color: var(--auth-primary-text);
  background: var(--auth-primary);
  font-weight: bold;
  box-shadow: var(--shadow-auth-primary);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.btn-auth:hover {
  background: var(--auth-primary-hover);
  transform: translateY(-1px);
}
```

**Nút phụ / ghost:**

- Nền transparent hoặc xám nhẹ.
- Chữ `#111827` hoặc `#64748B`.
- Border `#D7DEE7`.
- Hover đổi nền sang `--sidebar-bg-high`.

**Nút nguy hiểm:**

- Border dashed `rgba(255, 0, 0, 0.3)`.
- Nền `rgba(255, 0, 0, 0.05)`.
- Chữ đỏ `#EF4444`.
- Chỉ dùng cho xóa hội thoại, rời nhóm, hủy kết nối.

**Nút icon nhỏ:**

- Kích thước 28-32px vuông.
- Border: 0, nền transparent.
- Hover: nền `--sidebar-bg-highest`.
- Dùng cho: nút thêm tin nhắn, nút info, nút đóng.

**Trạng thái vô hiệu hóa / đang tải:**

- Giữ nguyên kích thước.
- `opacity: 0.5`.
- `cursor: not-allowed`.
- Trạng thái đang tải không làm nút đổi chiều rộng.

### 6.2 Input / Form

**Input chuẩn (search, filter, message):**

```css
.input {
  min-height: 44px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px 10px 40px;
  border: 1px solid var(--sidebar-border);
  border-radius: var(--radius-sm);
  color: var(--sidebar-text);
  background: var(--sidebar-bg-high);
  font-size: 12px;
  font-weight: 600;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.input::placeholder {
  color: var(--sidebar-muted);
}

.input:focus {
  border-color: var(--sidebar-primary);
  box-shadow: 0 0 0 2px rgba(18, 58, 74, 0.12);
}
```

**Input auth (nền sáng):**

```css
.input-auth {
  padding: 14px 14px 14px 45px;
  border: 1px solid var(--auth-border);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--auth-input-bg);
  color: var(--auth-input-text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-auth:focus {
  border-color: var(--auth-primary);
  box-shadow: 0 0 0 4px var(--auth-focus);
}
```

**Input tin nhắn:**

```css
.input-message {
  height: 44px;
  border: 1px solid var(--sidebar-border);
  border-radius: var(--radius-pill);
  padding: 0 18px;
  background: #FFFFFF;
  color: var(--sidebar-text);
  font-size: 14px;
}

.input-message:focus {
  border-color: var(--sidebar-primary);
  box-shadow: 0 0 0 3px rgba(18, 58, 74, 0.12);
}
```

**Quy tắc form:**

- Label cách input 6-8px (`margin-bottom: 0.45rem`).
- Form group cách nhau 16px (`margin-bottom: 1rem`).
- Lỗi hiển thị inline dưới field liên quan, dùng class `.error-message`, không dùng `alert()`.
- Required field nên có indicator nhất quán.
- Icon trong input: `position: absolute; left: 12-15px; top: 50%; transform: translateY(-50%);`.

### 6.3 Card Và Bề Mặt

**Channel item (hội thoại):**

```css
.channel-item {
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: 12px;
  background: transparent;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.channel-item:hover {
  background: rgba(255, 255, 255, 0.58);
}

.channel-item.active {
  background: #FFFFFF;
  border-color: var(--sidebar-border);
  box-shadow: var(--shadow-card);
}
```

**Contact card:**

```css
.contacts-card {
  background: var(--sidebar-bg-low);
  border: 1px solid var(--sidebar-border);
  border-radius: var(--radius-2xl);
  padding: 20px;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.contacts-card:hover {
  border-color: var(--sidebar-bg-highest);
  box-shadow: var(--shadow-card-hover);
}
```

**Section panel (slide panel, recommendation):**

```css
.section-panel {
  background: var(--sidebar-bg-low);
  border: 2px solid rgba(18, 58, 74, 0.15);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-toast);
  overflow: hidden;
}
```

**Auth card (full):**

```css
.auth-card {
  display: flex;
  width: 80vw;
  min-height: 560px;
  max-width: 1040px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-auth-card);
  overflow: hidden;
}
```

**Quy tắc card:**

- Channel item, contact card dùng aspect-ratio cố định cho avatar.
- Generic card padding 14-20px.
- Không dùng shadow đen nặng trên nền sáng.
- Không dùng card cho mọi section; slide panel và filter bar chỉ cần border + nền nhẹ.

### 6.4 Avatar

Avatar là element xuất hiện nhiều nhất trong ứng dụng chat. Cần nhất quán:

| Ngữ cảnh | Kích thước | Bo góc | Nền fallback |
|---|---:|---|---|
| Sidebar profile | 40px | `border-radius: 50%` | `--sidebar-primary` |
| Channel list | 42px | `border-radius: 12px` | `--sidebar-bg-highest` |
| Chat header | 40px | `border-radius: 12px` | `--sidebar-bg-highest` |
| Chat info detail | 64px (4rem) | `border-radius: 50%` | — |
| Contact card | 56px | `border-radius: 14px` | — |
| Search result | 36-40px | `border-radius: 12px` | — |

Quy tắc avatar:

- Luôn có `object-fit: cover`.
- Avatar không có ảnh → hiện icon `Users` hoặc chữ cái đầu username trên nền `--sidebar-primary`.
- Avatar có ảnh → border `1px solid var(--sidebar-border)`.
- Không kéo giãn, không đổi aspect-ratio.

### 6.5 Bong Bóng Tin Nhắn

```css
.message-bubble {
  max-width: min(70%, 560px);
  min-width: 40px;
  padding: 10px 14px;
  border-radius: var(--radius-message);
  line-height: 1.45;
  font-size: 14px;
  word-break: break-word;
  overflow-wrap: anywhere;
  box-shadow: var(--shadow-message);
}

.message-bubble.other {
  align-self: flex-start;
  background: #FFFFFF;
  color: var(--sidebar-text);
  border-bottom-left-radius: 5px;
}

.message-bubble.mine {
  align-self: flex-end;
  background: var(--sidebar-primary);
  color: #FFFFFF;
  border-bottom-right-radius: 5px;
}
```

### 6.6 Badge / Unread Dot

```css
.unread-dot {
  position: absolute;
  right: -6px;
  top: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border: 2px solid var(--sidebar-bg-low);
  border-radius: var(--radius-pill);
  background: var(--sidebar-error);
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
```

### 6.7 Online Dot

```css
.online-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-online);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.14);
  flex-shrink: 0;
}
```

### 6.8 Toast

```css
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  box-shadow: var(--shadow-toast);
}

.toast.success {
  background: var(--sidebar-primary);
  color: #FFFFFF;
  border-color: var(--sidebar-primary);
}

.toast.info {
  background: var(--sidebar-bg-high);
  color: var(--sidebar-text);
  border-color: var(--sidebar-border);
}
```

### 6.9 Tab Toggle (Auth)

```css
.mode-toggle {
  display: flex;
  gap: 0.35rem;
  border: 1px solid var(--auth-border);
  border-radius: 14px;
  background: var(--auth-tab-bg);
  padding: 0.3rem;
}

.mode-toggle button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--auth-panel-muted);
  font-weight: bold;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.mode-toggle button.active {
  background: var(--auth-tab-active-bg);
  color: var(--auth-panel-text);
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.08);
}
```

### 6.10 Trạng Thái Rỗng

```css
.empty-state {
  text-align: center;
  padding: 80px 20px;
  border: 2px dashed var(--sidebar-border);
  border-radius: var(--radius-2xl);
  background: var(--sidebar-bg-low);
}

.empty-state svg {
  color: var(--sidebar-border);
  margin-bottom: 12px;
}

.empty-state h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--sidebar-text);
  margin: 0 0 6px;
}

.empty-state p {
  font-size: 11px;
  color: var(--sidebar-muted);
  margin: 0;
}
```

---

## 7. Hướng Dẫn Theo Từng Trang

### 7.1 Layout Shell (`LayoutPage.jsx`)

- `display: flex; height: 100vh;` — Sidebar bên trái, main content flex: 1.
- Sidebar fixed trái, main content `overflow-y: auto`.
- Sidebar animation: width mượt giữa 64px (thu gọn trong /chat) và 280px (mở rộng ở trang khác).
- Dùng `motion` cho transition sidebar.

### 7.2 Sidebar (`Sidebar.jsx`)

- **Nền:** `--sidebar-bg` (`#F6F7F9`).
- **Brand icon:** 40x40px, bo góc 12px, nền `--sidebar-primary`, chữ trắng, shadow icon.
- **Title "Ivanix":** 18px, weight 700. Label "WORKSPACE": 10px, uppercase, `letter-spacing: 0.08em`.
- **Nav item:** min-height 48px, bo góc 12px, padding 12px 16px.
  - Mặc định: nền transparent, chữ `--sidebar-muted`.
  - Hover: nền `--sidebar-bg-high`, chữ `--sidebar-text`.
  - Active: nền `--sidebar-primary`, chữ trắng, shadow icon.
- **Thu gọn (/chat):** nav-item 48x48px, chỉ hiện icon, không text.
- **Profile section:** border-top `--sidebar-border`, avatar 40px tròn, profile info nhỏ.
- Icon dùng `lucide-react`, size 20px.

### 7.3 Trang Chat (`Chat.jsx`)

**Messages panel (danh sách hội thoại):**

- Width 320px (co 280px trên tablet).
- Nền `--sidebar-bg-low`.
- Heading "Tin nhắn": 20px, weight 700.
- Search input: nền `--sidebar-bg-high`, icon Search 16px.
- Channel list: gap 4px, scroll vertical.
- Channel item: bo góc 12px, padding 12px.
  - Active: nền trắng, border `--sidebar-border`, shadow nhẹ.
  - Avatar 42px bo góc 12px.
  - Tên 14px weight 500, timestamp 10px muted.
  - Unread: tên weight 700, mô tả weight 900.

**Chat container (vùng chat chính):**

- Nền `#F8FAFC`.
- Chat header: min-height 72px, backdrop-filter blur(12px).
  - Có gradient trang trí nhẹ (tím/cyan opacity rất thấp).
  - Avatar 40px bo góc 12px, tên 17px weight 700.
  - Online dot xanh lá, nút info 32px.
- Vùng tin nhắn: padding 24px, gap 10px, scroll vertical.
  - Tin nhắn mình: nền `--sidebar-primary`, chữ trắng, bo góc phải dưới 5px.
  - Tin nhắn khác: nền trắng, chữ `--sidebar-text`, bo góc trái dưới 5px.
  - Max-width: min(70%, 560px).
- Form gửi tin: padding 14px 20px, border-top, backdrop-filter blur(12px).
  - Input: height 44px, border-radius pill, nền trắng.
  - Nút gửi: height 44px, border-radius pill, nền `--sidebar-primary`.

**Chat info panel:**

- Flex: 0.45, border-left.
- Backdrop có gradient trang trí nhẹ (tím/lavender opacity rất thấp).
- Avatar detail: 64px tròn, tên chữ đậm.
- Section thành viên, tài nguyên, quyền riêng tư: border-top, padding 1rem.
- Nút rời nhóm/xóa: border dashed đỏ, nền đỏ rất nhạt, chữ đỏ.
- Nút thêm thành viên: border dashed xanh, nền xanh rất nhạt, chữ xanh.

### 7.4 Trang Đăng Nhập / Đăng Ký (`AuthPage.jsx`)

- **Nền:** ảnh `auth.png` full viewport, overlay gradient tối.
- **Auth card:** 80vw, max 1040px, bo góc 24px.
- **Bên trái (brand):** flex 4, nền `--auth-brand-bg`, logo + heading "Ivanix" cyan glow + subtitle.
- **Bên phải (form):** flex 6, nền `--auth-panel-bg`.
  - Tab toggle Login/Signup.
  - Form panel: max-width 520px, height 430px.
  - Input: padding left 45px cho icon, bo góc 12px.
  - Nút submit: width 100%, margin-top auto (dính đáy form).
  - Lỗi: class `.error-message` (đỏ), thành công: class `.success-message` (xanh lá).
- **Responsive 820px:** card full-width, flex-direction column, bên trái min-height 360px.
- Hỗ trợ `prefers-color-scheme: dark` cho auth tokens.
- Icon dùng `react-icons/md`: MdEmail, MdLock, MdPerson.

### 7.5 Trang Danh Bạ (`Contacts.jsx`)

- **Nền:** `--sidebar-bg`, margin-left 280px, padding 48px 0.
- **Header:** H1 "Danh bạ" 28px + icon Users, nút "Thêm bạn mới" / "Yêu cầu".
- **Slide panel tìm kiếm:** AnimatePresence height auto, nền `--sidebar-bg-low`, border teal nhẹ.
  - Tìm kiếm theo username.
  - Gợi ý kết nối: section riêng, grid auto-fill 280px.
- **Filter bar:** nền `--sidebar-bg-low`, border `--sidebar-border`, bo góc 12px.
  - Input filter + badge "Đang kết nối: N người".
- **Grid bạn bè:** auto-fill 300px, gap 20px.
- **Contact card:** nền `--sidebar-bg-low`, avatar 56px bo góc 14px.
  - Username 15px weight 700, email 10px monospace.
  - Trạng thái online/offline: dot 6px + text 9px.
  - Footer: nút "Nhắn tin" primary.
  - Nút xóa: ẩn, hiện khi hover card.
- **Trạng thái rỗng:** icon Users 38px, heading + mô tả + gợi ý CTA.

### 7.6 Trang Lưu Trữ (`Storage.jsx`)

- Hiện tại là placeholder đơn giản.
- Nên dùng cùng token hệ thống khi phát triển.
- Nền `--sidebar-bg` thay vì hardcode `#f0f0f0`.

---

## 8. Icon, Ảnh Và Media

### Icon

- **Primary:** `lucide-react` cho mọi UI icon.
  - Sidebar: MessageSquare, Users, BarChart3, Plus.
  - Chat: Search, Info, Users, Plus.
  - Contacts: Users, Search, MessageSquare, Trash2, Sparkles, UserPlus, X, Check, AtSign, Clock, ChevronDown, ChevronUp.
  - ChatInfo: Users, Info, BookOpen, ChevronDown, ShieldAlert.
- **Auth only:** `react-icons/md` — MdEmail, MdLock, MdPerson.
- Icon trong nút/nav: 14-20px.
- Icon trong trạng thái rỗng: 38px.
- Icon trong nút có text thì thêm `aria-hidden="true"`.
- Không trộn icon đặc/outline từ nhiều thư viện.
- Màu icon: `--sidebar-muted` mặc định, `--sidebar-primary` cho icon nhấn.

### Logo

| Ngữ cảnh | Cách hiển thị |
|---|---|
| Auth page (bên trái) | Logo image `logoauth.png` + text "Ivanix" cyan glow |
| Sidebar header | Icon "I" 40px nền teal + text "Ivanix" |
| Favicon | Chữ "I" hoặc symbol riêng |

Quy tắc:

- Không kéo giãn, không xoay.
- Vùng an toàn quanh logo.
- Text "Ivanix" trên sidebar dùng `h1`, 18px, weight 700.

### Ảnh

- Avatar: tỷ lệ `1:1`, `object-fit: cover`.
- Ảnh auth background: full viewport, `object-fit: cover`.
- Ảnh gửi qua tin nhắn (tương lai): max-width 320px, bo góc 12px.
- Ảnh có ý nghĩa nội dung phải có `alt`.
- Ảnh trang trí dùng `aria-hidden`.
- Fallback avatar: `user_avatar.png` hoặc icon Users.

### Chuyển Động

Dùng `motion` (framer-motion) cho animation:

- **Sidebar:** `type: "spring", stiffness: 300, damping: 30` cho width transition.
- **Nav label:** `opacity: 0 → 1, x: -10 → 0`.
- **Auth card:** `opacity: 0 → 1, scale: 0.95 → 1`.
- **Auth form panel:** `opacity: 0 → 1` với AnimatePresence mode="wait".
- **Slide panel (contacts):** `height: 0 → auto, opacity: 0 → 1`, duration 0.22s.
- **Contact card:** `opacity: 0 → 1, scale: 0.96 → 1`, exit `scale: 0.94, y: -8`.
- Hover card có thể `translateY(-1px)`.
- CSS transition mặc định: `160ms ease`.
- Tôn trọng `prefers-reduced-motion`.

---

## 9. Quy Tắc Responsive

| Breakpoint | Chiều rộng | Mục tiêu |
|---|---:|---|
| Mobile | `< 520px` | Chưa xử lý riêng, cần bổ sung |
| Tablet / Mobile large | `520-759px` | Chat: flex column, messages panel full-width |
| Tablet | `760-819px` | Chat: messages panel max-height 38vh |
| Desktop small | `820-899px` | Auth: card full-width, column |
| Desktop | `900-1439px` | Messages panel co 280px |
| Wide | `>= 1440px` | Layout đầy đủ |

Breakpoint hiện tại trong code:

| Breakpoint | File | Hành vi |
|---|---|---|
| `max-width: 900px` | `chat.css` | Messages panel co 280px |
| `max-width: 820px` | `auth.css` | Auth card full-width, flex column |
| `max-width: 760px` | `chat.css` | Chat layout column, messages panel full-width 38vh |
| `max-width: 720px` | `contacts.css` | Grid contacts 1 cột |

Quy tắc:

- Sidebar tự thu gọn khi ở `/chat` (64px), mở rộng ở trang khác (280px).
- Chat page cần xử lý mobile: ẩn messages panel hoặc hiện dạng drawer.
- Contacts page margin-left phải phản hồi theo sidebar width.
- Không để tràn ngang dưới 520px.
- Font display dùng `clamp`, không scale toàn bộ bằng `vw`.
- Nút trên mobile: min-height 44px, vùng bấm đủ lớn.

---

## 10. Quy Tắc Cấu Trúc Frontend

### 10.1 Cấu trúc thư mục hiện tại

```txt
fe/src/
  App.jsx                 ← Router chính
  main.jsx                ← Entry point, providers
  apis/                   ← API client functions
    auth.apis.js
    axiosClient.js
    conversation.apis.js
    message.apis.js
    user.apis.js
  assets/
    images/               ← Ảnh tĩnh (auth.png, logoauth.png, user_avatar.png)
    styles/               ← CSS theo trang/component
      auth.css
      chat.css
      chatinfo.css
      contacts.css
      layout.css
      sidebar.css
      storage.css
      userinfo.css
  components/             ← Component dùng chung
    ChatInfo.jsx
    LayoutPage.jsx
    Sidebar.jsx
    UserInfo.jsx
  context/                ← React Context providers
    AuthContext.jsx
    SocketContext.jsx
  pages/                  ← Page-level components
    AuthPage.jsx
    Chat.jsx
    Contacts.jsx
    Storage.jsx
  services/               ← Business logic layer
    auth.service.js
    conversation.service.js
    message.service.js
    socket.js
    user.service.js
  utils/                  ← Helper functions
```

### 10.2 Quy tắc đặt file

- **Pages:** Màn hình cấp route. Chỉ compose component ở đây; không đặt mock data lớn hoặc helper logic dài trong file page.
- **Components:** UI component tái sử dụng hoặc theo domain.
- **APIs:** API call function thuần túy, dùng `axiosClient`.
- **Services:** Layer xử lý business logic, gọi API và format dữ liệu.
- **Context:** React Context cho state toàn cục (auth, socket).
- **Styles:** Mỗi page/component có file CSS riêng, import trực tiếp.
- **Assets:** Ảnh tĩnh, không import từ path máy cá nhân.

### 10.3 Quy tắc CSS

- Token CSS đặt trong `:root` ở đầu file CSS liên quan.
- **Kế hoạch chuẩn hóa:** gom token vào `fe/src/assets/styles/tokens.css` và import ở `main.jsx`.
- Không hardcode màu trực tiếp, dùng CSS variable.
- Tên class theo convention: kebab-case, prefix theo domain (`contacts-`, `channel-`, `auth-`, `sidebar-`).
- Không dùng `!important` trừ edge case responsive rõ ràng.
- Transition mặc định: `160ms ease`.

### 10.4 Quy tắc dependency

- **React Router:** `react-router-dom` v6 cho routing.
- **Animation:** `motion` (framer-motion) cho animation.
- **Icon:** `lucide-react` (chính), `react-icons` (chỉ auth).
- **HTTP:** `axios` với `withCredentials: true`.
- **Socket:** `socket.io-client` với `withCredentials: true`.
- **Date:** `dayjs` với locale vi.
- **CSS Framework:** `bootstrap` có trong dependencies nhưng hạn chế sử dụng, ưu tiên custom CSS.
- Không commit `dist/`, `node_modules/`, `.env`.

---

## 11. Yêu Cầu Accessibility Và UX

Mỗi page/component cần kiểm tra:

- Heading đúng cấp: H1 cho tiêu đề trang, H2 cho panel/section, H3 cho card/subsection. Không nhảy từ `h1` sang `h4`.
- Nút là `<button>`, link điều hướng là `<a>` / React Router `Link`.
- Input có `<label>` với `htmlFor` hoặc `aria-label`.
- Focus nhìn thấy đủ rõ: border-color + box-shadow khi focus.
- Vùng click tối thiểu 44px (nav-item 48px, nút 44px, icon button 28-32px nhưng padding đủ).
- Lỗi form gắn với field liên quan (inline error message).
- Không chỉ dùng màu để truyền trạng thái: online dot kèm text "Online/Offline".
- Tương phản chữ đạt tối thiểu WCAG AA.
- Modal/drawer trap focus và có thể đóng bằng bàn phím.
- Trạng thái đang tải không làm layout nhảy mạnh.
- Trạng thái rỗng có heading + mô tả + gợi ý hành động.
- Tin nhắn list dùng `<ul>` / `<li>` cho semantic.
- Nút nav có `title` attribute cho tooltip khi sidebar thu gọn.
- Ảnh có `alt` text mô tả (logo, avatar).

---

## 12. Checklist Triển Khai

Trước khi hoàn thành một page/component:

- [ ] Có dùng token màu Ivanix chưa?
- [ ] Có hardcode màu ngoài token mà không có lý do thiết kế không? (vd: `#f0f0f0` trong storage.css)
- [ ] CTA chính có rõ và nhất quán không?
- [ ] Nút cùng cấp có cùng height/radius/font-weight không?
- [ ] Input có trạng thái focus/lỗi/vô hiệu hóa không?
- [ ] Grid có responsive chưa?
- [ ] Text dài có max-width và line-height dễ đọc không?
- [ ] Card có bị lồng quá mức không?
- [ ] Có trạng thái đang tải/rỗng/lỗi nếu dữ liệu bất đồng bộ không?
- [ ] Icon có cùng library/size không?
- [ ] Avatar có aspect-ratio cố định và fallback không?
- [ ] Mobile dưới 760px có hoạt động không?
- [ ] Focus bằng bàn phím có nhìn thấy không?
- [ ] Không dùng `alert()` cho lỗi form.
- [ ] Không hardcode z-index cực lớn (sidebar hiện dùng `z-index: 20`, chấp nhận).
- [ ] Không đổi route/API/logic khi chỉ chỉnh UI.
- [ ] CSS variable có ở trong `:root` không, hay hardcode trực tiếp?
- [ ] Transition dùng `160ms ease` nhất quán?
- [ ] Animation dùng `motion` không dùng raw CSS animation phức tạp?

---

## 13. Các Vấn Đề Cần Cải Thiện (Audit)

Danh sách các điểm chưa nhất quán trong code hiện tại cần được xử lý:

| # | File | Vấn đề | Mức độ |
|---|---|---|---|
| 1 | `storage.css` | Hardcode `#f0f0f0` thay vì dùng token | 🟡 Trung bình |
| 2 | `chatinfo.css` | Hardcode `#0070f3` (xanh dương) cho nút thêm thành viên — không nằm trong hệ màu | 🔴 Cao |
| 3 | `chatinfo.css` | Hardcode `#ff0000` cho nút rời/xóa — nên dùng `--sidebar-error` | 🟡 Trung bình |
| 4 | `userinfo.css` | Dùng `--text-color` và `--text-muted` không tồn tại trong `:root` | 🔴 Cao |
| 5 | `chatinfo.css` | Dùng `--text-color` không tồn tại | 🔴 Cao |
| 6 | `auth.css` | Dùng `#67e8f9` hardcode thay vì token cyan | 🟡 Trung bình |
| 7 | Toàn bộ | Token CSS nằm phân tán trong `sidebar.css`, `auth.css` — chưa có file token tập trung | 🟡 Trung bình |
| 8 | `chat.css` | Chat header có gradient tím/cyan trang trí — nên đánh giá có phù hợp brand không | 🟡 Trung bình |
| 9 | `contacts.css` | `margin-left: 280px` hardcode — không phản hồi sidebar width | 🟡 Trung bình |
| 10 | `ChatInfo.jsx` | Dùng `btn btn-primary` (Bootstrap class) cho nút thêm thành viên | 🟡 Trung bình |
| 11 | Icon | Auth dùng `react-icons/md`, còn lại dùng `lucide-react` — nên thống nhất hoặc ghi rõ ranh giới | 🟢 Thấp |
| 12 | Responsive | Chưa có breakpoint cho mobile < 520px | 🟡 Trung bình |

---

## 14. Kế Hoạch Chuẩn Hóa Token

### Bước 1: Tạo file token tập trung

Tạo `fe/src/assets/styles/tokens.css` chứa toàn bộ CSS variable trong `:root`. Import file này đầu tiên trong `main.jsx`.

### Bước 2: Loại bỏ hardcode

Thay thế mọi giá trị màu hardcode trong các file CSS bằng CSS variable tương ứng.

### Bước 3: Xử lý token không tồn tại

Thêm `--text-color` và `--text-muted` vào `:root` hoặc đổi sang token đã có (`--sidebar-text`, `--sidebar-muted`).

### Bước 4: Loại bỏ Bootstrap class

Thay `btn btn-primary`, `btn btn-danger` bằng class custom theo hệ thống Ivanix.

### Bước 5: Dark mode auth

Giữ `@media (prefers-color-scheme: dark)` cho auth, nhưng đảm bảo các token dark cũng nằm trong file token tập trung.

---

## 15. Prompt Nhanh Cho Dev

Khi yêu cầu chỉnh UI, có thể dùng prompt ngắn này:

```md
Hãy chỉnh UI theo hệ thống thiết kế Ivanix Webchat:

- Nền chính: sidebar-bg #F6F7F9, bg-low #EEF1F4, surface #FFFFFF.
- Chữ chính #111827, muted #64748B.
- CTA/active/focus dùng teal #123A4A, hover tối hơn #0D2D3A.
- Auth accent dùng teal #0F766E, hover #115E59.
- Border mềm #D7DEE7, focus shadow rgba(18,58,74,0.12).
- Error/badge dùng #EF4444, online #22C55E.
- Không thêm màu ngoài token nếu không có lý do thiết kế rõ ràng.
- Icon dùng lucide-react, size 14-20px.
- Bo góc: 8-12px cho input/card, 14-16px cho panel/section, 24px cho auth card, 999px cho input tin nhắn/nút gửi.
- Transition mặc định 160ms ease.
- Giữ logic/API/route hiện tại, chỉ chỉnh UI/layout/style.
- Đảm bảo responsive, trạng thái focus, trạng thái rỗng/lỗi.
```

---

## 16. Tóm Tắt Token Cốt Lõi

```css
/* ── Nền ── */
--bg: #F6F7F9;
--bg-low: #EEF1F4;
--bg-high: #E5E9EE;
--bg-highest: #DDE3EA;
--surface: #FFFFFF;
--surface-cool: #F8FAFC;

/* ── Chữ ── */
--text: #111827;
--muted: #64748B;

/* ── Thương hiệu ── */
--primary: #123A4A;
--primary-dark: #0D2D3A;
--auth-primary: #0F766E;
--auth-hover: #115E59;
--cyan-glow: #67E8F9;

/* ── Viền ── */
--border: #D7DEE7;
--border-soft: rgba(0, 0, 0, 0.06);
--focus-ring: rgba(18, 58, 74, 0.12);

/* ── Trạng thái ── */
--error: #EF4444;
--online: #22C55E;
```

---

## 17. Ghi Chú Kỹ Thuật

### Tech stack hiện tại

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool / Dev server |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Socket.IO Client | 4.x | WebSocket realtime |
| Motion (Framer Motion) | 12.x | Animation |
| Lucide React | 1.16.x | Icon library (chính) |
| React Icons | 5.x | Icon library (auth only) |
| Bootstrap | 5.x | CSS framework (hạn chế sử dụng) |
| Day.js | 1.x | Date formatting |
| Date-fns | 4.x | Date utilities |

### API endpoints

- Base URL: `http://localhost:4000/api`
- Auth: `/api/auth/signup`, `/api/auth/login`
- User: `/api/user/me`, `/api/user/search`
- Conversations: `/api/conversations`, `/api/conversations/groups`
- Messages: `/api/messages`
- Socket: `http://localhost:4000` với cookie JWT

### Tài liệu liên quan

- `docs/SRS_Webchat_realtime.md` — Đặc tả yêu cầu hệ thống.
- `docs/API_DOC.md` — Tài liệu API chi tiết.
- `docs/swagger.yaml` — API spec dạng Swagger.
- `README.md` — Hướng dẫn setup và tổng quan dự án.
