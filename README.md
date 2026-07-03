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
