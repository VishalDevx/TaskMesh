'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Flag,
} from 'lucide-react';
import { TaskWithDetails } from '@/types';
import { getInitials, formatDate } from '@/lib/utils';
import { useCreateComment, useUpdateTask, useDeleteTask } from '@/hooks/use-api';
import { usePresenceStore } from '@/stores/presence-store';

interface TaskCardProps {
  task: TaskWithDetails;
  workspaceId: string;
  boardId: string;
  isDragging?: boolean;
}

export function TaskCard({ task, workspaceId, boardId, isDragging }: TaskCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const createComment = useCreateComment();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { getTypingUsers } = usePresenceStore();

  const typingUsers = getTypingUsers(task.id);

  const handleSave = async () => {
    await updateTask.mutateAsync({
      taskId: task.id,
      data: { title, description },
    });
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    setIsOpen(false);
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    await createComment.mutateAsync({ taskId: task.id, content: comment });
    setComment('');
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <>
      <Card
        className={`cursor-pointer transition-shadow hover:shadow-md ${isDragging ? 'shadow-lg' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-3">
          {task.priority && (
            <Badge className={`mb-2 ${priorityColors[task.priority] || ''}`} variant="secondary">
              <Flag className="mr-1 h-3 w-3" />
              {task.priority}
            </Badge>
          )}

          <p className="font-medium">{task.title}</p>

          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assignee.name || '')}
                  </AvatarFallback>
                </Avatar>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </div>
              )}
            </div>
            {task._count?.comments ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {task._count.comments}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                />
              ) : (
                task.title
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="mt-2"
                />
              ) : (
                task.description || 'No description'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {task.assignee && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignee.image || undefined} />
                      <AvatarFallback>
                        {getInitials(task.assignee.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.name}</span>
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {isEditing ? 'Cancel edit' : 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateTask.isPending}>
                  Save changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : null}

            <div className="border-t pt-4">
              <h4 className="mb-2 font-semibold">Comments</h4>

              {typingUsers.length > 0 && (
                <p className="mb-2 text-sm text-muted-foreground">
                  {typingUsers.map((u) => u.name).join(', ')} typing...
                </p>
              )}

              <div className="space-y-3">
                {task.comments?.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.author.image || undefined} />
                      <AvatarFallback>
                        {getInitials(c.author.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim() || createComment.isPending}
                className="mt-2"
              >
                Add comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
