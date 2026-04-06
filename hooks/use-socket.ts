'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/types/socket';
import { useBoardStore } from '@/stores/board-store';
import { usePresenceStore } from '@/stores/presence-store';
import toast from 'react-hot-toast';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: { userId: session.user.id },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (data) => {
      toast.error(data.message);
    });

    return () => {
    };
  }, [session?.user?.id]);

  const joinWorkspace = useCallback((workspaceId: string) => {
    socket?.emit('workspace:join', { workspaceId });
  }, []);

  const leaveWorkspace = useCallback((workspaceId: string) => {
    socket?.emit('workspace:leave', { workspaceId });
  }, []);

  const joinBoard = useCallback((boardId: string) => {
    socket?.emit('board:join', { boardId });
  }, []);

  const leaveBoard = useCallback((boardId: string) => {
    socket?.emit('board:leave', { boardId });
  }, []);

  return {
    socket: socketRef.current,
    joinWorkspace,
    leaveWorkspace,
    joinBoard,
    leaveBoard,
  };
}

export function useBoardSocket(boardId: string) {
  const socketRef = useRef<TypedSocket | null>(null);
  const { data: session } = useSession();
  const { data: board, updateTask, addTask, removeTask, moveTask, updateColumn, addColumn, removeColumn } = useBoardStore();
  const { setPresence, removePresence, setTyping, clearTyping } = usePresenceStore();

  useEffect(() => {
    if (!session?.user?.id || !boardId) return;

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: { userId: session.user.id },
        transports: ['websocket', 'polling'],
      });
    }

    socketRef.current = socket;

    socket.emit('board:join', { boardId });

    socket.on('board:joined', (data) => {
      if (data.boardId === boardId) {
        data.presence.forEach((user) => {
          if (user.id !== session.user?.id) {
            setPresence(user);
          }
        });
      }
    });

    socket.on('presence:update', (data) => {
      if (data.id !== session.user?.id) {
        setPresence(data);
      }
    });

    socket.on('task:created', (data) => {
      if (data.userId !== session.user?.id && data.boardId === boardId) {
        addTask(data.task);
        toast.success('New task created');
      }
    });

    socket.on('task:updated', (data) => {
      if (data.userId !== session.user?.id && data.boardId === boardId) {
        updateTask(data.task);
        toast.success('Task updated');
      }
    });

    socket.on('task:moved', (data) => {
      if (data.userId !== session.user?.id && data.boardId === boardId) {
        moveTask(data);
      }
    });

    socket.on('task:deleted', (data) => {
      if (data.boardId === boardId) {
        removeTask(data.taskId);
        toast.success('Task deleted');
      }
    });

    socket.on('column:created', (data) => {
      if (data.userId !== session.user?.id && data.boardId === boardId) {
        addColumn(data.column);
      }
    });

    socket.on('column:updated', (data) => {
      if (data.userId !== session.user?.id && data.boardId === boardId) {
        updateColumn(data.column);
      }
    });

    socket.on('column:deleted', (data) => {
      if (data.boardId === boardId) {
        removeColumn(data.columnId);
      }
    });

    socket.on('comment:created', (data) => {
      if (data.userId !== session.user?.id) {
        toast.success('New comment');
      }
    });

    socket.on('typing:start', (data) => {
      if (data.userId !== session.user?.id) {
        setTyping(data.taskId, data.user);
      }
    });

    socket.on('typing:stop', (data) => {
      if (data.userId !== session.user?.id) {
        clearTyping(data.taskId, data.userId);
      }
    });

    return () => {
      socket?.emit('board:leave', { boardId });
      socket?.off('board:joined');
      socket?.off('presence:update');
      socket?.off('task:created');
      socket?.off('task:updated');
      socket?.off('task:moved');
      socket?.off('task:deleted');
      socket?.off('column:created');
      socket?.off('column:updated');
      socket?.off('column:deleted');
      socket?.off('comment:created');
      socket?.off('typing:start');
      socket?.off('typing:stop');
    };
  }, [session?.user?.id, boardId]);

  const emitTaskCreate = useCallback((task: any) => {
    socket?.emit('task:create', { task, boardId });
  }, [boardId]);

  const emitTaskUpdate = useCallback((task: any) => {
    socket?.emit('task:update', { task, boardId });
  }, [boardId]);

  const emitTaskMove = useCallback((data: any) => {
    socket?.emit('task:move', { ...data, boardId });
  }, [boardId]);

  const emitTaskDelete = useCallback((taskId: string) => {
    socket?.emit('task:delete', { taskId, boardId });
  }, [boardId]);

  const emitColumnCreate = useCallback((column: any) => {
    socket?.emit('column:create', { column, boardId });
  }, [boardId]);

  const emitColumnUpdate = useCallback((column: any) => {
    socket?.emit('column:update', { column, boardId });
  }, [boardId]);

  const emitColumnDelete = useCallback((columnId: string) => {
    socket?.emit('column:delete', { columnId, boardId });
  }, [boardId]);

  const emitTypingStart = useCallback((taskId: string) => {
    socket?.emit('typing:start', { taskId });
  }, []);

  const emitTypingStop = useCallback((taskId: string) => {
    socket?.emit('typing:stop', { taskId });
  }, []);

  return {
    socket: socketRef.current,
    emitTaskCreate,
    emitTaskUpdate,
    emitTaskMove,
    emitTaskDelete,
    emitColumnCreate,
    emitColumnUpdate,
    emitColumnDelete,
    emitTypingStart,
    emitTypingStop,
  };
}
