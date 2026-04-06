'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './task-card';
import { TaskWithDetails } from '@/types';

interface SortableTaskCardProps {
  task: TaskWithDetails;
  workspaceId: string;
  boardId: string;
}

export function SortableTaskCard({ task, workspaceId, boardId }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} workspaceId={workspaceId} boardId={boardId} />
    </div>
  );
}
