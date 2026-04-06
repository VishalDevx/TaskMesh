import type { Socket } from 'socket.io';
import type { z } from 'zod';

export interface ServerToClientEvents {
  'workspace:joined': (data: { workspaceId: string; members: PresenceUser[] }) => void;
  'workspace:left': (data: { workspaceId: string }) => void;
  'workspace:member_joined': (data: PresenceUser) => void;
  'workspace:member_left': (data: { userId: string }) => void;

  'board:joined': (data: { boardId: string; presence: PresenceUser[] }) => void;
  'board:left': (data: { boardId: string }) => void;
  'presence:update': (data: PresenceUser) => void;

  'task:created': (data: TaskSocketPayload) => void;
  'task:updated': (data: TaskSocketPayload) => void;
  'task:moved': (data: TaskMovedPayload) => void;
  'task:deleted': (data: { taskId: string; columnId: string; boardId: string }) => void;

  'column:created': (data: ColumnSocketPayload) => void;
  'column:updated': (data: ColumnSocketPayload) => void;
  'column:deleted': (data: { columnId: string; boardId: string }) => void;

  'comment:created': (data: CommentSocketPayload) => void;
  'comment:updated': (data: CommentSocketPayload) => void;
  'comment:deleted': (data: { commentId: string; taskId: string }) => void;

  'typing:start': (data: { userId: string; taskId: string; user: PresenceUser }) => void;
  'typing:stop': (data: { userId: string; taskId: string }) => void;

  'notification:new': (data: { notification: NotificationPayload }) => void;

  error: (data: { message: string; code: string }) => void;
}

export interface ClientToServerEvents {
  'workspace:join': (data: { workspaceId: string }) => void;
  'workspace:leave': (data: { workspaceId: string }) => void;

  'board:join': (data: { boardId: string }) => void;
  'board:leave': (data: { boardId: string }) => void;

  'presence:update': (data: { boardId?: string; isTyping?: boolean; taskId?: string }) => void;

  'task:create': (data: CreateTaskPayload) => void;
  'task:update': (data: UpdateTaskPayload) => void;
  'task:move': (data: MoveTaskPayload) => void;
  'task:delete': (data: { taskId: string; boardId: string }) => void;

  'column:create': (data: CreateColumnPayload) => void;
  'column:update': (data: UpdateColumnPayload) => void;
  'column:delete': (data: { columnId: string; boardId: string }) => void;

  'comment:create': (data: CreateCommentPayload) => void;
  'comment:update': (data: UpdateCommentPayload) => void;
  'comment:delete': (data: { commentId: string; taskId: string }) => void;

  'typing:start': (data: { taskId: string }) => void;
  'typing:stop': (data: { taskId: string }) => void;
}

export interface TaskSocketPayload {
  task: {
    id: string;
    title: string;
    description: string | null;
    position: number;
    priority: string | null;
    dueDate: string | null;
    columnId: string;
    boardId: string;
    assignee: { id: string; name: string | null; image: string | null } | null;
  };
  userId: string;
  boardId: string;
}

export interface TaskMovedPayload {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newPosition: number;
  boardId: string;
  userId: string;
}

export interface ColumnSocketPayload {
  column: {
    id: string;
    name: string;
    position: number;
    color: string | null;
    boardId: string;
    tasks: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      priority: string | null;
      dueDate: string | null;
      columnId: string;
    }>;
  };
  userId: string;
  boardId: string;
}

export interface CommentSocketPayload {
  comment: {
    id: string;
    content: string;
    taskId: string;
    authorId: string;
    createdAt: string;
    author: { id: string; name: string | null; image: string | null };
  };
  userId: string;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  columnId: string;
  boardId: string;
  priority?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  taskId: string;
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
  boardId: string;
}

export interface MoveTaskPayload {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newPosition: number;
  boardId: string;
}

export interface CreateColumnPayload {
  name: string;
  boardId: string;
  color?: string;
}

export interface UpdateColumnPayload {
  columnId: string;
  name?: string;
  color?: string;
  boardId: string;
}

export interface CreateCommentPayload {
  taskId: string;
  content: string;
}

export interface UpdateCommentPayload {
  commentId: string;
  content: string;
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

export interface TypedSocket extends Socket {
  data: {
    userId?: string;
    workspaceId?: string;
    boardId?: string;
  };
}
