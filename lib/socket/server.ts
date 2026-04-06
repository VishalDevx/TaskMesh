import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextServer } from 'next/dist/server/next';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  TypedSocket,
  PresenceUser,
} from '@/types/socket';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

type SocketServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

const PRESENCE_TTL = 60;

class SocketService {
  private io: SocketServer | null = null;
  private presence: Map<string, PresenceUser> = new Map();

  async initialize(httpServer: HTTPServer) {
    if (this.io) return;

    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket: TypedSocket) => {
      this.handleConnection(socket);
    });

    console.log('Socket.IO server initialized');
  }

  private async handleConnection(socket: TypedSocket) {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });

    if (!user) {
      socket.disconnect();
      return;
    }

    socket.emit('connected', { userId });

    socket.on('workspace:join', (data) => this.handleWorkspaceJoin(socket, data));
    socket.on('workspace:leave', (data) => this.handleWorkspaceLeave(socket, data));
    socket.on('board:join', (data) => this.handleBoardJoin(socket, data));
    socket.on('board:leave', (data) => this.handleBoardLeave(socket, data));
    socket.on('presence:update', (data) => this.handlePresenceUpdate(socket, data));

    socket.on('task:create', (data) => this.handleTaskCreate(socket, data));
    socket.on('task:update', (data) => this.handleTaskUpdate(socket, data));
    socket.on('task:move', (data) => this.handleTaskMove(socket, data));
    socket.on('task:delete', (data) => this.handleTaskDelete(socket, data));

    socket.on('column:create', (data) => this.handleColumnCreate(socket, data));
    socket.on('column:update', (data) => this.handleColumnUpdate(socket, data));
    socket.on('column:delete', (data) => this.handleColumnDelete(socket, data));

    socket.on('comment:create', (data) => this.handleCommentCreate(socket, data));
    socket.on('comment:update', (data) => this.handleCommentUpdate(socket, data));
    socket.on('comment:delete', (data) => this.handleCommentDelete(socket, data));

    socket.on('typing:start', (data) => this.handleTypingStart(socket, data));
    socket.on('typing:stop', (data) => this.handleTypingStop(socket, data));

    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  private async handleWorkspaceJoin(socket: TypedSocket, data: { workspaceId: string }) {
    const { workspaceId } = data;
    socket.data.workspaceId = workspaceId;
    socket.join(`workspace:${workspaceId}`);

    const presenceUsers = await this.getWorkspacePresence(workspaceId);

    socket.emit('workspace:joined', { workspaceId, members: presenceUsers });
    socket.to(`workspace:${workspaceId}`).emit('workspace:member_joined', {
      id: socket.data.userId!,
      name: (await prisma.user.findUnique({ where: { id: socket.data.userId! } }))?.name || null,
      image: (await prisma.user.findUnique({ where: { id: socket.data.userId! } }))?.image || null,
      socketId: socket.id,
      boardId: '',
      isTyping: false,
      lastSeen: new Date(),
    });
  }

  private async handleWorkspaceLeave(socket: TypedSocket, data: { workspaceId: string }) {
    const { workspaceId } = data;
    socket.leave(`workspace:${workspaceId}`);
    socket.to(`workspace:${workspaceId}`).emit('workspace:member_left', { userId: socket.data.userId! });
  }

  private async handleBoardJoin(socket: TypedSocket, data: { boardId: string }) {
    const { boardId } = data;
    socket.data.boardId = boardId;
    socket.join(`board:${boardId}`);

    await this.updatePresence(socket.data.userId!, boardId);

    const presenceUsers = await this.getBoardPresence(boardId);

    socket.emit('board:joined', { boardId, presence: presenceUsers });

    socket.to(`board:${boardId}`).emit('presence:update', {
      id: socket.data.userId!,
      name: (await prisma.user.findUnique({ where: { id: socket.data.userId! } }))?.name || null,
      image: (await prisma.user.findUnique({ where: { id: socket.data.userId! } }))?.image || null,
      socketId: socket.id,
      boardId,
      isTyping: false,
      lastSeen: new Date(),
    });
  }

  private async handleBoardLeave(socket: TypedSocket, data: { boardId: string }) {
    const { boardId } = data;
    socket.leave(`board:${boardId}`);
    await this.removePresence(socket.data.userId!, boardId);
    socket.to(`board:${boardId}`).emit('presence:update', {
      id: socket.data.userId!,
      name: '',
      image: null,
      socketId: socket.id,
      boardId: '',
      isTyping: false,
      lastSeen: new Date(),
    });
  }

  private async handlePresenceUpdate(
    socket: TypedSocket,
    data: { boardId?: string; isTyping?: boolean; taskId?: string }
  ) {
    const userId = socket.data.userId!;
    const boardId = data.boardId || socket.data.boardId;

    if (!boardId) return;

    await this.updatePresence(userId, boardId, data.isTyping);

    socket.to(`board:${boardId}`).emit('presence:update', {
      id: userId,
      name: (await prisma.user.findUnique({ where: { id: userId } }))?.name || null,
      image: (await prisma.user.findUnique({ where: { id: userId } }))?.image || null,
      socketId: socket.id,
      boardId,
      isTyping: data.isTyping || false,
      lastSeen: new Date(),
    });
  }

  private async handleTaskCreate(socket: TypedSocket, data: any) {
    const boardId = data.boardId;
    socket.to(`board:${boardId}`).emit('task:created', {
      task: data.task,
      userId: socket.data.userId!,
      boardId,
    });
  }

  private async handleTaskUpdate(socket: TypedSocket, data: any) {
    const boardId = data.boardId;
    socket.to(`board:${boardId}`).emit('task:updated', {
      task: data.task,
      userId: socket.data.userId!,
      boardId,
    });
  }

  private async handleTaskMove(socket: TypedSocket, data: any) {
    socket.to(`board:${data.boardId}`).emit('task:moved', data);
  }

  private async handleTaskDelete(socket: TypedSocket, data: any) {
    socket.to(`board:${data.boardId}`).emit('task:deleted', data);
  }

  private async handleColumnCreate(socket: TypedSocket, data: any) {
    const boardId = data.boardId;
    socket.to(`board:${boardId}`).emit('column:created', {
      column: data.column,
      userId: socket.data.userId!,
      boardId,
    });
  }

  private async handleColumnUpdate(socket: TypedSocket, data: any) {
    const boardId = data.boardId;
    socket.to(`board:${boardId}`).emit('column:updated', {
      column: data.column,
      userId: socket.data.userId!,
      boardId,
    });
  }

  private async handleColumnDelete(socket: TypedSocket, data: any) {
    socket.to(`board:${data.boardId}`).emit('column:deleted', data);
  }

  private async handleCommentCreate(socket: TypedSocket, data: any) {
    socket.to(`board:${data.boardId}`).emit('comment:created', {
      comment: data.comment,
      userId: socket.data.userId!,
    });
  }

  private async handleCommentUpdate(socket: TypedSocket, data: any) {
    socket.to(`board:${data.boardId}`).emit('comment:updated', {
      comment: data.comment,
      userId: socket.data.userId!,
    });
  }

  private async handleCommentDelete(socket: TypedSocket, data: any) {
    socket.to(`board:${data.boardId}`).emit('comment:deleted', data);
  }

  private async handleTypingStart(socket: TypedSocket, data: { taskId: string }) {
    const boardId = socket.data.boardId;
    if (!boardId) return;

    const user = await prisma.user.findUnique({
      where: { id: socket.data.userId! },
      select: { id: true, name: true, image: true },
    });

    socket.to(`board:${boardId}`).emit('typing:start', {
      userId: socket.data.userId!,
      taskId: data.taskId,
      user: {
        id: user!.id,
        name: user!.name,
        image: user!.image,
        socketId: socket.id,
        boardId,
        isTyping: true,
        lastSeen: new Date(),
      },
    });
  }

  private async handleTypingStop(socket: TypedSocket, data: { taskId: string }) {
    const boardId = socket.data.boardId;
    if (!boardId) return;

    socket.to(`board:${boardId}`).emit('typing:stop', {
      userId: socket.data.userId!,
      taskId: data.taskId,
    });
  }

  private async handleDisconnect(socket: TypedSocket) {
    const userId = socket.data.userId;
    const boardId = socket.data.boardId;

    if (boardId) {
      await this.removePresence(userId!, boardId);
      socket.to(`board:${boardId}`).emit('workspace:member_left', { userId });
    }

    if (socket.data.workspaceId) {
      socket.to(`workspace:${socket.data.workspaceId}`).emit('workspace:member_left', { userId });
    }
  }

  private async updatePresence(userId: string, boardId: string, isTyping = false) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });

    if (!user) return;

    const presence: PresenceUser = {
      id: user.id,
      name: user.name,
      image: user.image,
      socketId: socket.id,
      boardId,
      isTyping,
      lastSeen: new Date(),
    };

    const key = `presence:${boardId}:${userId}`;
    await redis.setex(key, PRESENCE_TTL, JSON.stringify(presence));
    this.presence.set(key, presence);
  }

  private async removePresence(userId: string, boardId: string) {
    const key = `presence:${boardId}:${userId}`;
    await redis.del(key);
    this.presence.delete(key);
  }

  private async getBoardPresence(boardId: string): Promise<PresenceUser[]> {
    const pattern = `presence:${boardId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) return [];

    const values = await redis.mget(keys);
    const presence: PresenceUser[] = [];

    for (const value of values) {
      if (value) {
        presence.push(JSON.parse(value));
      }
    }

    return presence;
  }

  private async getWorkspacePresence(workspaceId: string): Promise<PresenceUser[]> {
    const pattern = `presence:*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) return [];

    const values = await redis.mget(keys);
    const presence: PresenceUser[] = [];

    for (const value of values) {
      if (value) {
        const parsed = JSON.parse(value);
        presence.push(parsed);
      }
    }

    return presence;
  }

  getIO() {
    return this.io;
  }
}

export const socketService = new SocketService();
