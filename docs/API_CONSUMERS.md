# API Consumer Registry - Humans Only

**Last Updated:** 2026-02-27
**Project:** Humans Only Anti-AI Social Platform
**Purpose:** Track all API endpoints and their consumers for safe refactoring

---

## Purpose of this Document

This registry tracks:
1. All API endpoints in the application
2. Which frontend components/hooks consume each endpoint
3. Request/Response types
4. Last verification date

**CRITICAL:** Update this file after ANY API change to prevent breaking the frontend!

## Wave 4 Additions (2026-02-27)

New account control endpoints:
- `GET/POST /api/users/preferences`
- `GET /api/users/blocked`
- `GET /api/users/muted`
- `POST /api/users/[username]/block`
- `POST /api/users/[username]/unblock`
- `POST /api/users/[username]/mute`
- `POST /api/users/[username]/unmute`
- `POST /api/reports`
- `GET /api/health`

---

## Table of Contents

- [Authentication API](#authentication-api)
- [User API](#user-api)
- [Tweet API](#tweet-api)
- [Notification API](#notification-api)
- [Message API](#message-api)
- [Search API](#search-api)

---

## Authentication API

### POST /api/auth/login

**Defined in:** `app/src/app/api/auth/login/route.ts`

**Request Body:**
```typescript
{
  username: string;
  password: string;
}
```

**Response:**
```typescript
{
  message: string;
  user: User;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Login form | 2025-12-21 |

---

### POST /api/auth/logout

**Defined in:** `app/src/app/api/auth/logout/route.ts`

**Request Body:** None

**Response:**
```typescript
{
  message: string;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Logout button | 2025-12-21 |

---

### POST /api/auth/verify

**Defined in:** `app/src/app/api/auth/verify/route.ts`

**Request Body:**
```typescript
{
  token: string;
}
```

**Response:**
```typescript
{
  valid: boolean;
  user?: User;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Auth verification | 2025-12-21 |

---

## User API

### POST /api/users/create

**Defined in:** `app/src/app/api/users/create/route.ts`

**Request Body:**
```typescript
{
  username: string;
  password: string;
  email: string;
  displayName: string;
}
```

**Response:**
```typescript
{
  message: string;
  user: User;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Registration form | 2025-12-21 |

---

### GET /api/users/[username]

**Defined in:** `app/src/app/api/users/[username]/route.ts`

**URL Parameters:**
- `username` - User's username

**Response:**
```typescript
User & {
  _count: {
    followers: number;
    following: number;
    tweets: number;
  }
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | User profile page | 2025-12-21 |

---

### PATCH /api/users/[username]/edit

**Defined in:** `app/src/app/api/users/[username]/edit/route.ts`

**URL Parameters:**
- `username` - User's username

**Request Body:**
```typescript
{
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePicture?: string;
  headerImage?: string;
}
```

**Response:**
```typescript
{
  message: string;
  user: User;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Edit profile form | 2025-12-21 |

---

### POST /api/users/[username]/follow

**Defined in:** `app/src/app/api/users/[username]/follow/route.ts`

**URL Parameters:**
- `username` - Username to follow

**Response:**
```typescript
{
  message: string;
  follower: Follower;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Follow button | 2025-12-21 |

---

### DELETE /api/users/[username]/unfollow

**Defined in:** `app/src/app/api/users/[username]/unfollow/route.ts`

**URL Parameters:**
- `username` - Username to unfollow

**Response:**
```typescript
{
  message: string;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Unfollow button | 2025-12-21 |

---

### GET /api/users/exists

**Defined in:** `app/src/app/api/users/exists/route.ts`

**Query Parameters:**
- `username` - Username to check

**Response:**
```typescript
{
  exists: boolean;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Registration form validation | 2025-12-21 |

---

### GET /api/users/random

**Defined in:** `app/src/app/api/users/random/route.ts`

**Query Parameters:**
- `limit?` - Number of users to return (default: 3)

**Response:**
```typescript
User[]
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | "Who to follow" sidebar | 2025-12-21 |

---

## Tweet API

### POST /api/tweets/create

**Defined in:** `app/src/app/api/tweets/create/route.ts`

**Request Body:**
```typescript
{
  content: string;
  media?: string[];
  replyTo?: string;
}
```

**Response:**
```typescript
{
  message: string;
  tweet: Tweet;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Tweet compose form | 2025-12-21 |

---

### GET /api/tweets/all

**Defined in:** `app/src/app/api/tweets/all/route.ts`

**Query Parameters:**
- `cursor?` - Pagination cursor
- `limit?` - Number of tweets (default: 10)

**Response:**
```typescript
{
  tweets: Tweet[];
  nextCursor: string | null;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Home timeline | 2025-12-21 |

---

### GET /api/tweets/[username]/[tweetId]

**Defined in:** `app/src/app/api/tweets/[username]/[tweetId]/route.ts`

**URL Parameters:**
- `username` - Tweet author username
- `tweetId` - Tweet ID

**Response:**
```typescript
Tweet & {
  author: User;
  likes: Like[];
  retweets: Retweet[];
  replies: Tweet[];
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Tweet detail page | 2025-12-21 |

---

### DELETE /api/tweets/[username]/[tweetId]/delete

**Defined in:** `app/src/app/api/tweets/[username]/[tweetId]/delete/route.ts`

**URL Parameters:**
- `username` - Tweet author username
- `tweetId` - Tweet ID

**Response:**
```typescript
{
  message: string;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Delete tweet button | 2025-12-21 |

---

### POST /api/tweets/[username]/[tweetId]/like

**Defined in:** `app/src/app/api/tweets/[username]/[tweetId]/like/route.ts`

**URL Parameters:**
- `username` - Tweet author username
- `tweetId` - Tweet ID

**Response:**
```typescript
{
  message: string;
  like: Like;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Like button | 2025-12-21 |

---

### DELETE /api/tweets/[username]/[tweetId]/unlike

**Defined in:** `app/src/app/api/tweets/[username]/[tweetId]/unlike/route.ts`

**URL Parameters:**
- `username` - Tweet author username
- `tweetId` - Tweet ID

**Response:**
```typescript
{
  message: string;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Unlike button | 2025-12-21 |

---

### POST /api/tweets/[username]/[tweetId]/retweet

**Defined in:** `app/src/app/api/tweets/[username]/[tweetId]/retweet/route.ts`

**URL Parameters:**
- `username` - Tweet author username
- `tweetId` - Tweet ID

**Response:**
```typescript
{
  message: string;
  retweet: Retweet;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Retweet button | 2025-12-21 |

---

### DELETE /api/tweets/[username]/[tweetId]/unretweet

**Defined in:** `app/src/app/api/tweets/[username]/[tweetId]/unretweet/route.ts`

**URL Parameters:**
- `username` - Tweet author username
- `tweetId` - Tweet ID

**Response:**
```typescript
{
  message: string;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Undo retweet button | 2025-12-21 |

---

### POST /api/tweets/[username]/[tweetId]/reply

**Defined in:** `app/src/app/api/tweets/[username]/[tweetId]/reply/route.ts`

**URL Parameters:**
- `username` - Original tweet author username
- `tweetId` - Original tweet ID

**Request Body:**
```typescript
{
  content: string;
  media?: string[];
}
```

**Response:**
```typescript
{
  message: string;
  reply: Tweet;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Reply form | 2025-12-21 |

---

### GET /api/tweets/[username]

**Defined in:** `app/src/app/api/tweets/[username]/route.ts`

**URL Parameters:**
- `username` - User's username

**Query Parameters:**
- `cursor?` - Pagination cursor
- `limit?` - Number of tweets

**Response:**
```typescript
{
  tweets: Tweet[];
  nextCursor: string | null;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | User profile tweets tab | 2025-12-21 |

---

### GET /api/tweets/[username]/likes

**Defined in:** `app/src/app/api/tweets/[username]/likes/route.ts`

**URL Parameters:**
- `username` - User's username

**Response:**
```typescript
Tweet[]
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | User profile likes tab | 2025-12-21 |

---

### GET /api/tweets/[username]/media

**Defined in:** `app/src/app/api/tweets/[username]/media/route.ts`

**URL Parameters:**
- `username` - User's username

**Response:**
```typescript
Tweet[]
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | User profile media tab | 2025-12-21 |

---

### GET /api/tweets/[username]/replies

**Defined in:** `app/src/app/api/tweets/[username]/replies/route.ts`

**URL Parameters:**
- `username` - User's username

**Response:**
```typescript
Tweet[]
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | User profile replies tab | 2025-12-21 |

---

### GET /api/tweets/related

**Defined in:** `app/src/app/api/tweets/related/route.ts`

**Query Parameters:**
- `tweetId` - Original tweet ID

**Response:**
```typescript
Tweet[]
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Related tweets sidebar | 2025-12-21 |

---

## Notification API

### GET /api/notifications

**Defined in:** `app/src/app/api/notifications/route.ts`

**Query Parameters:**
- `cursor?` - Pagination cursor
- `limit?` - Number of notifications

**Response:**
```typescript
{
  notifications: Notification[];
  nextCursor: string | null;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Notifications page | 2025-12-21 |

---

### POST /api/notifications/create

**Defined in:** `app/src/app/api/notifications/create/route.ts`

**Request Body:**
```typescript
{
  type: 'like' | 'retweet' | 'follow' | 'reply' | 'mention';
  fromUserId: string;
  toUserId: string;
  tweetId?: string;
}
```

**Response:**
```typescript
{
  message: string;
  notification: Notification;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Internal notification triggers | 2025-12-21 |

---

### PATCH /api/notifications/read

**Defined in:** `app/src/app/api/notifications/read/route.ts`

**Request Body:**
```typescript
{
  notificationIds: string[];
}
```

**Response:**
```typescript
{
  message: string;
  count: number;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Mark as read action | 2025-12-21 |

---

## Message API

### GET /api/messages/[username]

**Defined in:** `app/src/app/api/messages/[username]/route.ts`

**URL Parameters:**
- `username` - Conversation partner username

**Query Parameters:**
- `cursor?` - Pagination cursor
- `limit?` - Number of messages

**Response:**
```typescript
{
  messages: Message[];
  conversation: Conversation;
  nextCursor: string | null;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | DM conversation view | 2025-12-21 |

---

### POST /api/messages/create

**Defined in:** `app/src/app/api/messages/create/route.ts`

**Request Body:**
```typescript
{
  recipientUsername: string;
  content: string;
  media?: string;
}
```

**Response:**
```typescript
{
  message: string;
  newMessage: Message;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Send message form | 2025-12-21 |

---

### DELETE /api/messages/delete

**Defined in:** `app/src/app/api/messages/delete/route.ts`

**Request Body:**
```typescript
{
  messageId: string;
}
```

**Response:**
```typescript
{
  message: string;
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Delete message button | 2025-12-21 |

---

## Search API

### GET /api/search

**Defined in:** `app/src/app/api/search/route.ts`

**Query Parameters:**
- `q` - Search query
- `type?` - 'users' | 'tweets' | 'all' (default: 'all')

**Response:**
```typescript
{
  users: User[];
  tweets: Tweet[];
}
```

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| TBD | Search page | 2025-12-21 |

---

## Type Definitions

### Core Types Reference

All types defined in: `app/src/types/` (to be documented)

**Common Types:**
```typescript
// User
interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePicture?: string;
  headerImage?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tweet
interface Tweet {
  id: string;
  content: string;
  authorId: string;
  media?: string[];
  replyToId?: string;
  retweetOfId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Like
interface Like {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

// Retweet
interface Retweet {
  id: string;
  userId: string;
  tweetId: string;
  createdAt: Date;
}

// Follower
interface Follower {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// Notification
interface Notification {
  id: string;
  type: 'like' | 'retweet' | 'follow' | 'reply' | 'mention';
  fromUserId: string;
  toUserId: string;
  tweetId?: string;
  read: boolean;
  createdAt: Date;
}

// Message
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  media?: string;
  createdAt: Date;
}

// Conversation
interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Update Guidelines

### When to Update This Document

**ALWAYS update when:**
1. Creating new API endpoints
2. Modifying existing endpoint signatures
3. Changing request/response types
4. Deprecating endpoints
5. Adding new consumers

### How to Update

**For New Endpoints:**
```markdown
### METHOD /api/path

**Defined in:** `app/src/app/api/path/route.ts`

**Request Body/Query:** [describe]

**Response:** [describe]

**Consumers:**

| File | Usage | Last Check |
|------|-------|------------|
| [component] | [purpose] | [date] |
```

**For New Consumers:**
Add row to existing endpoint's consumer table with:
- Component/hook file path
- How it's used
- Today's date

---

## Breaking Change Protocol

### Before Making Breaking Changes

1. Check this document for all consumers
2. Create migration plan for each consumer
3. Document changes in CHANGELOG.md
4. Update API version if necessary

### After Making Changes

1. Update this document
2. Update all consumers
3. Test all affected flows
4. Mark "Last Check" date as today

---

## Notes

- **TBD Consumers:** Frontend consumer analysis pending - needs code inspection
- **Type Definitions:** Full type definitions to be extracted from Prisma schema
- **Versioning:** Currently no API versioning - all endpoints are v1 implicit
- **Authentication:** Most endpoints require JWT authentication via cookies

---

## TODO

- [ ] Identify all frontend consumers for each endpoint
- [ ] Extract full TypeScript types from codebase
- [ ] Document authentication requirements per endpoint
- [ ] Add rate limiting information
- [ ] Add example requests/responses
- [ ] Document error codes and messages
- [ ] Create API testing suite

---

**Maintainer:** Technical Writer Agent
**Review Frequency:** After every API change
**Last Full Audit:** 2025-12-21
