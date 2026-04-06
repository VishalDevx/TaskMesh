'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoard, useCreateTask, useMoveTask } from '@/hooks/use-api';
import { useBoardStore } from '@/stores/board-store';
import { useBoardSocket } from '@/hooks/use-socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SortableTaskCard } from '@/features/board/components/sortable-task-card';
import { TaskCard } from '@/features/board/components/task-card';
import { ColumnHeader } from '@/features/board/components/column-header';
import { ArrowLeft, Plus, Loader2, Users, MessageSquare } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { TaskWithDetails, ColumnWithTasks } from '@/types';

export default function BoardPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const boardId = params.boardId as string;

  const { data: boardData, isLoading } = useBoard(workspaceId, boardId);
  const { board, setBoard, moveTask: storeMoveTask } = useBoardStore();
  const { emitTaskMove } = useBoardSocket(boardId);
  const moveTask = useMoveTask();

  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (boardData) {
      setBoard(boardData);
    }
  }, [boardData, setBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeColumn = board?.columns.find((col) =>
      col.tasks.some((task) => task.id === active.id)
    );
    const task = activeColumn?.tasks.find((task) => task.id === active.id);
    if (task) {
      setActiveTask(task as TaskWithDetails);
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !board) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const sourceColumn = board.columns.find((col) =>
        col.tasks.some((task) => task.id === activeId)
      );

      let destinationColumn = board.columns.find((col) =>
        col.tasks.some((task) => task.id === overId)
      );

      if (!destinationColumn) {
        destinationColumn = board.columns.find((col) => col.id === overId);
      }

      if (!sourceColumn || !destinationColumn) return;

      const sourceTaskIds = sourceColumn.tasks.map((t) => t.id);
      const destTaskIds = destinationColumn.tasks.map((t) => t.id);

      let newSourceTaskIds: string[];
      let newDestTaskIds: string[];
      let newPosition: number;

      if (sourceColumn.id === destinationColumn.id) {
        const oldIndex = sourceTaskIds.indexOf(activeId);
        const newIndex = destTaskIds.indexOf(overId);

        if (oldIndex === newIndex) return;

        newSourceTaskIds = [...sourceTaskIds];
        newSourceTaskIds.splice(oldIndex, 1);
        newSourceTaskIds.splice(newIndex, 0, activeId);
        newDestTaskIds = newSourceTaskIds;
        newPosition = newIndex;
      } else {
        const newIndex = destTaskIds.indexOf(overId);
        newSourceTaskIds = sourceTaskIds.filter((id) => id !== activeId);
        newDestTaskIds = [...destTaskIds];
        newDestTaskIds.splice(newIndex >= 0 ? newIndex : destTaskIds.length, 0, activeId);
        newPosition = newIndex >= 0 ? newIndex : destTaskIds.length;
      }

      storeMoveTask({
        taskId: activeId,
        sourceColumnId: sourceColumn.id,
        destinationColumnId: destinationColumn.id,
        newPosition,
      });

      try {
        await moveTask.mutateAsync({
          taskId: activeId,
          sourceColumnId: sourceColumn.id,
          destinationColumnId: destinationColumn.id,
          newPosition,
        });
        emitTaskMove({
          taskId: activeId,
          sourceColumnId: sourceColumn.id,
          destinationColumnId: destinationColumn.id,
          newPosition,
        });
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    },
    [board, storeMoveTask, moveTask, emitTaskMove]
  );

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(columnId);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId,
          title: newTaskTitle,
          boardId,
        }),
      });
      if (response.ok) {
        const task = await response.json();
        setNewTaskTitle('');
        setActiveColumnId(null);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsAddingTask(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Board not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspaces/${workspaceId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">{board.name}</h1>
              {board.description && (
                <p className="text-sm text-muted-foreground">{board.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-blue-500 text-xs text-white">JD</AvatarFallback>
              </Avatar>
              <Avatar className="-ml-2 h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-green-500 text-xs text-white">MK</AvatarFallback>
              </Avatar>
              <Avatar className="-ml-2 h-8 w-8 border-2 border-white">
                <AvatarFallback className="bg-purple-500 text-xs text-white">AS</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" className="ml-2">
                <Users className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex w-80 flex-shrink-0 flex-col rounded-lg bg-slate-100"
              >
                <ColumnHeader column={column} workspaceId={workspaceId} boardId={boardId} />

                <div className="flex-1 overflow-y-auto p-2">
                  <SortableContext
                    items={column.tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {column.tasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          workspaceId={workspaceId}
                          boardId={boardId}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  {isAddingTask === column.id ? (
                    <div className="mt-2 rounded-lg bg-white p-3 shadow-sm">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title..."
                        className="mb-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask(column.id);
                          if (e.key === 'Escape') {
                            setIsAddingTask(null);
                            setNewTaskTitle('');
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAddTask(column.id)}>
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingTask(null);
                            setNewTaskTitle('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="mt-2 w-full justify-start text-muted-foreground"
                      onClick={() => {
                        setIsAddingTask(column.id);
                        setActiveColumnId(column.id);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add a task
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="h-12 w-80 flex-shrink-0 border-dashed"
              onClick={() => {
                const name = prompt('Enter column name:');
                if (name) {
                  fetch(`/api/workspaces/${workspaceId}/boards/${boardId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'column',
                      data: { name },
                    }),
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add column
            </Button>
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} workspaceId={workspaceId} boardId={boardId} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}
