CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS message_seen;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_members;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('private', 'group')),
    name VARCHAR(100),

    participant_key TEXT,

    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_sender_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONVERSATION MEMBERS
-- ============================================================================

CREATE TABLE conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES conversations(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    role VARCHAR(20)
        DEFAULT 'member'
        CHECK (role IN ('admin', 'member')),

    unread_count INT DEFAULT 0,

    cleared_history_at TIMESTAMP WITH TIME ZONE,

    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(conversation_id, user_id)
);

-- ============================================================================
-- MESSAGES
-- ============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Socket.IO recovery
    server_offset BIGSERIAL UNIQUE,

    -- Client retry id
    client_offset TEXT UNIQUE,

    conversation_id UUID
        REFERENCES conversations(id) ON DELETE CASCADE,

    sender_id UUID
        REFERENCES users(id) ON DELETE SET NULL,

    content TEXT,

    message_type VARCHAR(20)
        DEFAULT 'text'
        CHECK (
            message_type IN (
                'text',
                'image',
                'file',
                'video',
                'audio'
            )
        ),

    file_url TEXT,
    file_name VARCHAR(255),

    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_deleted CHECK (
        (is_deleted = FALSE AND deleted_at IS NULL)
        OR
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
    )
);

-- Circular FK
ALTER TABLE conversations
ADD COLUMN last_message_id UUID
REFERENCES messages(id)
ON DELETE SET NULL;

-- ============================================================================
-- MESSAGE SEEN
-- ============================================================================

CREATE TABLE message_seen (
    message_id UUID NOT NULL
        REFERENCES messages(id) ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (message_id, user_id)
);

-- ============================================================================
-- FRIEND REQUESTS
-- ============================================================================

CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    receiver_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(20)
        DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_sender_receiver_different
        CHECK (sender_id <> receiver_id),

    UNIQUE(sender_id, receiver_id)
);

-- ============================================================================
-- FRIENDSHIPS
-- ============================================================================

CREATE TABLE friendships (
    user_id1 UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    user_id2 UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY(user_id1, user_id2),

    CONSTRAINT check_user_order
        CHECK (user_id1 < user_id2)
);

-- ============================================================================
-- USERS INDEXES
-- ============================================================================

CREATE INDEX idx_users_username_lower
ON users(lower(username));

CREATE INDEX idx_users_email_lower
ON users(lower(email));

CREATE INDEX idx_users_username_trgm
ON users
USING gin(username gin_trgm_ops);

-- ============================================================================
-- CONVERSATIONS INDEXES
-- ============================================================================

CREATE INDEX idx_conversations_last_message_at
ON conversations(last_message_at DESC);

CREATE UNIQUE INDEX idx_conversations_participant_key
ON conversations(participant_key)
WHERE participant_key IS NOT NULL;

CREATE INDEX idx_conversations_name_trgm
ON conversations
USING gin(name gin_trgm_ops);

-- ============================================================================
-- CONVERSATION MEMBERS INDEXES
-- ============================================================================

CREATE INDEX idx_members_user_id
ON conversation_members(user_id);

CREATE INDEX idx_members_conversation_id
ON conversation_members(conversation_id);

-- ============================================================================
-- MESSAGE INDEXES
-- ============================================================================

CREATE INDEX idx_messages_conversation_created_at
ON messages(conversation_id, created_at DESC);

CREATE INDEX idx_messages_conversation_offset
ON messages(conversation_id, server_offset DESC);

-- ============================================================================
-- MESSAGE SEEN INDEXES
-- ============================================================================

CREATE INDEX idx_message_seen_user_id
ON message_seen(user_id);

-- ============================================================================
-- FRIEND INDEXES
-- ============================================================================

CREATE INDEX idx_friendships_user2_user1
ON friendships(user_id2, user_id1);

CREATE INDEX idx_friend_requests_receiver_status
ON friend_requests(receiver_id, status);