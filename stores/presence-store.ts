import { create } from 'zustand';
import { PresenceUser } from '@/types/socket';

interface TypingUser {
  user: PresenceUser;
  startedAt: Date;
}

interface PresenceState {
  presence: Map<string, PresenceUser>;
  typing: Map<string, TypingUser[]>;
  setPresence: (user: PresenceUser) => void;
  removePresence: (userId: string) => void;
  clearPresence: () => void;
  setTyping: (taskId: string, user: PresenceUser) => void;
  clearTyping: (taskId: string, userId: string) => void;
  getBoardPresence: (boardId: string) => PresenceUser[];
  getTypingUsers: (taskId: string) => PresenceUser[];
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presence: new Map(),
  typing: new Map(),

  setPresence: (user) =>
    set((state) => {
      const newPresence = new Map(state.presence);
      newPresence.set(user.id, user);
      return { presence: newPresence };
    }),

  removePresence: (userId) =>
    set((state) => {
      const newPresence = new Map(state.presence);
      newPresence.delete(userId);
      return { presence: newPresence };
    }),

  clearPresence: () => set({ presence: new Map() }),

  setTyping: (taskId, user) =>
    set((state) => {
      const newTyping = new Map(state.typing);
      const currentTyping = newTyping.get(taskId) || [];
      const filteredTyping = currentTyping.filter((t) => t.user.id !== user.id);
      newTyping.set(taskId, [...filteredTyping, { user, startedAt: new Date() }]);
      return { typing: newTyping };
    }),

  clearTyping: (taskId, userId) =>
    set((state) => {
      const newTyping = new Map(state.typing);
      const currentTyping = newTyping.get(taskId) || [];
      newTyping.set(
        taskId,
        currentTyping.filter((t) => t.user.id !== userId)
      );
      return { typing: newTyping };
    }),

  getBoardPresence: (boardId) => {
    const { presence } = get();
    return Array.from(presence.values()).filter((p) => p.boardId === boardId);
  },

  getTypingUsers: (taskId) => {
    const { typing } = get();
    const typingUsers = typing.get(taskId) || [];
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    return typingUsers
      .filter((t) => t.startedAt > fiveSecondsAgo)
      .map((t) => t.user);
  },
}));
