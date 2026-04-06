'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ColumnWithTasks } from '@/types';

interface ColumnHeaderProps {
  column: ColumnWithTasks;
  workspaceId: string;
  boardId: string;
}

export function ColumnHeader({ column, workspaceId, boardId }: ColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const queryClient = useQueryClient();

  const handleRename = async () => {
    if (name.trim() === column.name) {
      setIsEditing(false);
      return;
    }

    try {
      await fetch(`/api/columns/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    } catch (error) {
      console.error('Failed to rename column:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this column and all its tasks?')) return;

    try {
      await fetch(`/api/columns/${column.id}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  return (
    <div className="flex items-center justify-between border-b p-3">
      {isEditing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8"
          autoFocus
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') {
              setName(column.name);
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <div className="flex items-center gap-2">
          <h3
            className="font-semibold"
            onDoubleClick={() => setIsEditing(true)}
          >
            {column.name}
          </h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
            {column.tasks.length}
          </span>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
