# Collaborative Workspace

A production-grade real-time collaborative workspace application for teams. Built with Next.js 14, TypeScript, PostgreSQL, Redis, and Socket.IO.

## Features

- **Authentication**: Secure registration, login, and session management with Auth.js
- **Workspace Management**: Create and manage workspaces with role-based access control
- **Team Collaboration**: Invite members via email, assign roles (Owner, Admin, Member)
- **Real-time Task Board**: Kanban-style boards with drag-and-drop task management
- **Real-time Presence**: See who's online, typing indicators, live updates
- **Comments**: Task-level comments with @mentions support
- **Notifications**: In-app notifications for invites, mentions, and assignments
- **Activity Logs**: Track workspace events and changes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache/Pub-Sub**: Redis
- **Real-time**: Socket.IO
- **State Management**: Zustand (client), TanStack Query (server)
- **Forms**: React Hook Form, Zod validation
- **UI Components**: Radix UI primitives, Lucide icons

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API route handlers
├── components/            # Shared UI components
│   └── ui/                # Base UI components (Button, Input, Card, etc.)
├── features/               # Feature-based modules
│   ├── auth/             # Authentication feature
│   ├── board/             # Task board feature
│   ├── workspace/         # Workspace feature
│   └── notifications/     # Notifications feature
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and clients
│   ├── socket/           # Socket.IO server setup
│   └── validations/      # Zod schemas
├── server/                # Server-side code
│   ├── repositories/     # Data access layer
│   └── services/         # Business logic
├── stores/                # Zustand stores
├── types/                 # TypeScript type definitions
└── prisma/               # Database schema and seed
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (for local development)
- PostgreSQL 16+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd collaborative-workspace
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/collaborative_workspace?schema=public"
   REDIS_URL="redis://localhost:6379"
   AUTH_SECRET="generate-a-secure-secret-key"
   AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
   ```

### Using Docker (Recommended)

1. Start the services:
   ```bash
   docker-compose up -d
   ```

2. Generate Prisma client:
   ```bash
   docker-compose exec app npx prisma generate
   ```

3. Run database migrations:
   ```bash
   docker-compose exec app npx prisma db push
   ```

4. Seed the database:
   ```bash
   docker-compose exec app npx prisma db seed
   ```

### Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Push schema to database:
   ```bash
   npm run db:push
   ```

4. Seed the database:
   ```bash
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Test Accounts

After seeding, you can log in with these accounts:

| Email | Password |
|-------|----------|
| john@example.com | password123 |
| jane@example.com | password123 |
| bob@example.com | password123 |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

### API Endpoints

#### Authentication
- `POST /api/auth/[...nextauth]` - Auth.js endpoints

#### Workspaces
- `GET /api/workspaces` - List user's workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/[id]` - Get workspace details
- `PATCH /api/workspaces/[id]` - Update workspace
- `DELETE /api/workspaces/[id]` - Delete workspace

#### Members
- `GET /api/workspaces/[id]/members` - List members
- `PATCH /api/workspaces/[id]/members` - Update member role
- `DELETE /api/workspaces/[id]/members` - Remove member

#### Boards
- `GET /api/workspaces/[id]/boards` - List boards
- `POST /api/workspaces/[id]/boards` - Create board
- `GET /api/workspaces/[id]/boards/[id]` - Get board with columns/tasks
- `PATCH /api/workspaces/[id]/boards/[id]` - Update board
- `DELETE /api/workspaces/[id]/boards/[id]` - Delete board

#### Tasks
- `GET /api/tasks/[id]` - Get task details
- `PATCH /api/tasks/[id]` - Update/move task
- `DELETE /api/tasks/[id]` - Delete task

#### Comments
- `POST /api/tasks/[id]/comments` - Add comment
- `PATCH /api/comments/[id]` - Update comment
- `DELETE /api/comments/[id]` - Delete comment

#### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Mark as read

#### Invitations
- `POST /api/workspaces/[id]/invitations` - Send invitation
- `GET /api/invitations/[token]` - Get invitation details
- `POST /api/invitations/[token]` - Accept/reject invitation

## Socket.IO Events

### Client → Server
- `workspace:join` - Join workspace room
- `board:join` - Join board room
- `task:create` - Create task
- `task:update` - Update task
- `task:move` - Move task between columns
- `task:delete` - Delete task
- `typing:start` - Start typing
- `typing:stop` - Stop typing

### Server → Client
- `task:created` - New task created
- `task:updated` - Task updated
- `task:moved` - Task moved
- `task:deleted` - Task deleted
- `presence:update` - Presence update
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

## Role-Based Access Control

| Permission | Owner | Admin | Member |
|------------|-------|-------|--------|
| Update workspace | ✓ | ✓ | |
| Delete workspace | ✓ | | |
| Invite members | ✓ | ✓ | |
| Manage members | ✓ | ✓ | |
| Remove members | ✓ | | |
| Update roles | ✓ | | |
| Create boards | ✓ | ✓ | |
| Manage boards | ✓ | ✓ | |
| Manage tasks | ✓ | ✓ | ✓ |
| Assign tasks | ✓ | ✓ | ✓ |

## License

MIT
