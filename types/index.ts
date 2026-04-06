import type { Role, NotificationType, ActivityAction } from '@prisma/client';

export type { Role, NotificationType, ActivityAction };

export interface WorkspaceWithMembers {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: WorkspaceMemberWithUser[];
  _count?: {
    members: number;
    boards: number;
  };
}

export interface WorkspaceMemberWithUser {
  id: string;
  role: Role;
  joinedAt: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface BoardWithColumns {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  position: number;
  workspaceId: string;
  columns: ColumnWithTasks[];
}

export interface ColumnWithTasks {
  id: string;
  name: string;
  position: number;
  color: string | null;
  boardId: string;
  tasks: TaskWithDetails[];
}

export interface TaskWithDetails {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: string | null;
  dueDate: string | null;
  columnId: string;
  assigneeId: string | null;
  creatorId: string;
  assignee: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  comments: CommentWithAuthor[];
  _count?: {
    comments: number;
  };
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: Date;
  taskId: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  mentions: string[];
}

export interface NotificationWithWorkspace {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: Date;
  userId: string;
}

export interface ActivityLogWithUser {
  id: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface PresenceUser {
  id: string;
  name: string | null;
  image: string | null;
  socketId: string;
  boardId: string;
  isTyping: boolean;
  lastSeen: Date;
}

export interface InvitationWithWorkspace {
  id: string;
  email: string;
  role: Role;
  token: string;
  status: string;
  expiresAt: Date;
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  sender: {
    name: string | null;
    image: string | null;
  } | null;
}
