import { create } from 'zustand';
import { BoardWithColumns, ColumnWithTasks, TaskWithDetails } from '@/types';

interface BoardState {
  board: BoardWithColumns | null;
  isLoading: boolean;
  error: string | null;
  setBoard: (board: BoardWithColumns | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateTask: (task: Partial<TaskWithDetails> & { id: string }) => void;
  addTask: (task: Partial<TaskWithDetails> & { id: string }) => void;
  removeTask: (taskId: string) => void;
  moveTask: (data: {
    taskId: string;
    sourceColumnId: string;
    destinationColumnId: string;
    newPosition: number;
  }) => void;
  updateColumn: (column: Partial<ColumnWithTasks> & { id: string }) => void;
  addColumn: (column: ColumnWithTasks) => void;
  removeColumn: (columnId: string) => void;
  reorderColumns: (columnIds: string[]) => void;
  reorderTasks: (columnId: string, taskIds: string[]) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  isLoading: false,
  error: null,
  setBoard: (board) => set({ board }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  updateTask: (taskUpdate) =>
    set((state) => {
      if (!state.board) return state;

      const updatedColumns = state.board.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === taskUpdate.id ? { ...task, ...taskUpdate } : task
        ),
      }));

      return {
        board: { ...state.board, columns: updatedColumns },
      };
    }),

  addTask: (task) =>
    set((state) => {
      if (!state.board) return state;

      const updatedColumns = state.board.columns.map((column) => {
        if (column.id === task.columnId) {
          return {
            ...column,
            tasks: [...column.tasks, task as TaskWithDetails].sort(
              (a, b) => a.position - b.position
            ),
          };
        }
        return column;
      });

      return {
        board: { ...state.board, columns: updatedColumns },
      };
    }),

  removeTask: (taskId) =>
    set((state) => {
      if (!state.board) return state;

      const updatedColumns = state.board.columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => task.id !== taskId),
      }));

      return {
        board: { ...state.board, columns: updatedColumns },
      };
    }),

  moveTask: (data) =>
    set((state) => {
      if (!state.board) return state;

      const { taskId, sourceColumnId, destinationColumnId, newPosition } = data;

      let taskToMove: TaskWithDetails | undefined;

      const updatedColumns = state.board.columns.map((column) => {
        if (column.id === sourceColumnId) {
          const task = column.tasks.find((t) => t.id === taskId);
          if (task) taskToMove = { ...task, columnId: destinationColumnId };
          return {
            ...column,
            tasks: column.tasks
              .filter((t) => t.id !== taskId)
              .map((t, idx) => ({ ...t, position: idx })),
          };
        }
        return column;
      });

      if (!taskToMove) return state;

      const finalColumns = updatedColumns.map((column) => {
        if (column.id === destinationColumnId) {
          const newTasks = [...column.tasks];
          newTasks.splice(newPosition, 0, taskToMove!);
          return {
            ...column,
            tasks: newTasks.map((t, idx) => ({ ...t, position: idx })),
          };
        }
        return column;
      });

      return {
        board: { ...state.board, columns: finalColumns },
      };
    }),

  updateColumn: (columnUpdate) =>
    set((state) => {
      if (!state.board) return state;

      const updatedColumns = state.board.columns.map((column) =>
        column.id === columnUpdate.id ? { ...column, ...columnUpdate } : column
      );

      return {
        board: { ...state.board, columns: updatedColumns },
      };
    }),

  addColumn: (column) =>
    set((state) => {
      if (!state.board) return state;

      return {
        board: {
          ...state.board,
          columns: [...state.board.columns, column].sort(
            (a, b) => a.position - b.position
          ),
        },
      };
    }),

  removeColumn: (columnId) =>
    set((state) => {
      if (!state.board) return state;

      return {
        board: {
          ...state.board,
          columns: state.board.columns.filter((c) => c.id !== columnId),
        },
      };
    }),

  reorderColumns: (columnIds) =>
    set((state) => {
      if (!state.board) return state;

      const columnMap = new Map(
        state.board.columns.map((c) => [c.id, c])
      );

      const reorderedColumns = columnIds
        .map((id, idx) => {
          const column = columnMap.get(id);
          return column ? { ...column, position: idx } : null;
        })
        .filter(Boolean) as ColumnWithTasks[];

      return {
        board: { ...state.board, columns: reorderedColumns },
      };
    }),

  reorderTasks: (columnId, taskIds) =>
    set((state) => {
      if (!state.board) return state;

      const updatedColumns = state.board.columns.map((column) => {
        if (column.id === columnId) {
          const taskMap = new Map(column.tasks.map((t) => [t.id, t]));
          const reorderedTasks = taskIds
            .map((id, idx) => {
              const task = taskMap.get(id);
              return task ? { ...task, position: idx } : null;
            })
            .filter(Boolean) as TaskWithDetails[];
          return { ...column, tasks: reorderedTasks };
        }
        return column;
      });

      return {
        board: { ...state.board, columns: updatedColumns },
      };
    }),
}));
