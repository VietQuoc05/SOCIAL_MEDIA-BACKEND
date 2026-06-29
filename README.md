# Social Media Backend

A feature-rich social media backend built with **NestJS**, **TypeORM**, **PostgreSQL**, **Socket.IO**, and **MinIO** (S3-compatible storage). This API powers a full-stack social media platform with real-time messaging, posts, comments, reactions, and more.

---

## 🚀 Features

### 🔐 Authentication & Security
- **JWT-based authentication** with access + refresh token rotation
- **Email verification flow** using SendGrid (with pending user queue)
- **Auto-resend verification email** on login attempt for unverified accounts
- **Forgot / Reset password** with time-limited tokens
- **bcrypt password hashing**
- **CORS** with configurable allowed origins

### 👥 Users & Profiles
- User registration with email, username, and display name
- Profile management (avatar, cover photo, bio, social links)
- Public/private follower and following lists
- **Mutual friends count** on profile pages
- **User search** by display name or username (priority: display name)
- Soft delete support

### 🔗 Follow System
- Follow / Unfollow users
- Follower and following lists with privacy controls
- Follow stats (follower count, following count)
- **Suggested users** — recommends users with the most mutual friends that the current user hasn't followed yet

### 📝 Posts
- Create posts with captions and multiple images
- Cursor-based pagination for infinite scroll feed
- Feed generation (posts from followed users)
- Post deletion with real-time broadcast via WebSocket
- Image upload to MinIO (S3-compatible)

### 💬 Comments
- Create, update, and delete comments on posts
- Nested replies (parent-child comment structure)
- Optional image attachment on comments

### ❤️ Reactions
- Like / Unlike posts and comments
- Real-time reaction count updates via WebSocket
- Optimistic UI support with total reaction count sync

### 💬 Real-time Chat
- One-on-one messaging with conversation management
- Send text messages and images
- **Cursor-based pagination** for message history
- **Read receipts** with per-conversation unread count
- **Typing indicators** (broadcast via WebSocket)
- Real-time message delivery via Socket.IO

### 📡 Real-time Events (WebSocket)
- `post_created` / `post_deleted` — broadcast new/deleted posts
- `reaction_update` — sync reaction counts across clients
- `new_comment` — notify on new comments
- `new_message` / `messages_read` — real-time chat
- `typing` / `stop_typing` — typing indicators

### 📧 Email (SendGrid)
- Verification email on registration
- Auto-resend verification on unverified login
- Password reset email
- Dev mode: logs emails to console when no API key is set

### 📁 File Uploads
- MinIO (S3-compatible) for image/file storage
- Local upload fallback for development
- Avatar, cover photo, post images, comment images, chat images

### 📖 API Documentation
- Swagger UI at `/api` with Bearer token authentication
- Health check endpoint at `/health`

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | NestJS 10 |
| **Language** | TypeScript |
| **Database** | PostgreSQL 15 |
| **ORM** | TypeORM 0.3 |
| **Auth** | Passport + JWT |
| **Real-time** | Socket.IO |
| **File Storage** | MinIO (S3-compatible) |
| **Email** | SendGrid API |
| **Validation** | class-validator + class-transformer |
| **API Docs** | Swagger / OpenAPI |

---

## 🐳 Docker Setup

The project includes a full `docker-compose.yml` with:

- **PostgreSQL** — database (port 5433)
- **MinIO** — file storage (ports 9000, 9001)
- **Backend** — NestJS API (port 3000)
- **Frontend** — Next.js app (port 3000, behind nginx)
- **Nginx** — reverse proxy (port 80)
- **pgAdmin** — database admin UI (port 5051)

```bash
docker-compose up -d
```

---

## 🛠 Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- MinIO (or S3-compatible storage)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start in watch mode
npm run start:dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3000` |
| `HOST` | API server host | `0.0.0.0` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database user | `soc` |
| `DB_PASSWORD` | Database password | `soc` |
| `DB_DATABASE` | Database name | `soc` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | Refresh token expiry | `7` |
| `SENDGRID_API_KEY` | SendGrid API key (optional in dev) | — |
| `MAIL_FROM` | Sender email address | — |
| `FRONTEND_URL` | Frontend URL for email links | `http://localhost:3001` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | — |
| `MINIO_ENDPOINT` | MinIO server endpoint | `localhost` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minio` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minio123` |
| `MINIO_BUCKET` | MinIO bucket name | `social` |
| `MINIO_USE_SSL` | Use SSL for MinIO | `false` |

---

## 📁 Project Structure

```
src/
├── main.ts                          # App bootstrap, Swagger, CORS
├── app.module.ts                    # Root module
├── common/
│   ├── decorators/
│   │   └── user.decorator.ts        # @CurrentUser decorator
│   ├── enums/
│   │   └── reaction.enum.ts         # Reaction type enum
│   └── guards/
│       └── jwt.guard.ts             # JWT auth guard
├── config/                          # Configuration
├── database/
│   └── entities/                    # TypeORM entities
│       ├── user.entity.ts
│       ├── follow.entity.ts
│       ├── post.entity.ts
│       ├── comment.entity.ts
│       ├── reaction.entity.ts
│       ├── message.entity.ts
│       ├── conversation.entity.ts
│       ├── refresh-token.entity.ts
│       └── pending-user.entity.ts
├── events/
│   ├── events.gateway.ts            # WebSocket gateway
│   └── events.module.ts
└── modules/
    ├── auth/                        # Auth, register, verify, reset password
    ├── users/                       # User profiles, search, followers
    ├── follow/                      # Follow/unfollow, stats, suggestions
    ├── posts/                       # CRUD posts, feed with cursor pagination
    ├── comments/                    # CRUD comments, nested replies
    ├── reactions/                   # Like/unlike posts & comments
    ├── chat/                        # Conversations, messages, read receipts
    ├── uploads/                     # File upload to MinIO/local
    └── mail/                        # SendGrid email service
```

---

## 📡 API Endpoints

### Auth (`/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user (sends verification email) |
| POST | `/auth/login` | Login (auto-resends verification if unverified) |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/verify?token=` | Verify email |
| POST | `/auth/resend-verify` | Resend verification email |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Users (`/users`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users |
| GET | `/users/me` | Get current user profile |
| GET | `/users/:id` | Get user by ID (with mutual friends count) |
| GET | `/users/search?q=` | Search users |
| GET | `/users/:id/followers` | Get user's followers |
| GET | `/users/:id/following` | Get user's following |
| PATCH | `/users/me` | Update profile |

### Follow (`/follow`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/follow/followers` | Get followers |
| GET | `/follow/following` | Get following |
| GET | `/follow/stats` | Get follow stats |
| GET | `/follow/suggested?limit=` | Get suggested users (by mutual friends) |
| POST | `/follow/:id` | Follow user |
| DELETE | `/follow/:id` | Unfollow user |

### Posts (`/posts`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/posts/feed?cursor=&limit=` | Get feed (cursor-based pagination) |
| GET | `/posts/me` | Get current user's posts |
| GET | `/posts/:id` | Get post by ID |
| GET | `/posts/user/:userId` | Get user's posts |
| POST | `/posts` | Create post |
| DELETE | `/posts/:id` | Delete post |

### Comments (`/comments`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/comments/post/:postId` | Get comments for a post |
| POST | `/comments/:postId` | Create comment |
| PATCH | `/comments/:id` | Update comment |
| DELETE | `/comments/:id/:postId` | Delete comment |

### Reactions (`/reactions`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/reactions/post/:postId` | Toggle like on post |
| POST | `/reactions/comment/:commentId` | Toggle like on comment |

### Chat (`/chat`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/conversations` | Get all conversations |
| POST | `/chat/conversation/:userId` | Get or create conversation |
| GET | `/chat/messages/:conversationId?cursor=&limit=` | Get messages |
| POST | `/chat/message` | Send message |
| POST | `/chat/read/:conversationId` | Mark conversation as read |

### Upload (`/upload`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload/file` | Upload file (returns key + URL) |

---

## 📄 License

MIT