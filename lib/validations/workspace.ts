import { z } from 'zod';
import { Role } from '@prisma/client';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  logo: z.string().url().optional().nullable(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
  logo: z.string().url().optional().nullable(),
});

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(Role).default(Role.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const createBoardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});

export const createColumnSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  color: z.string().max(20).optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').optional(),
  color: z.string().max(20).optional().nullable(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  priority: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().cuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200, 'Title is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional().nullable(),
  priority: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().cuid(),
  sourceColumnId: z.string().cuid(),
  destinationColumnId: z.string().cuid(),
  newPosition: z.number().int().min(0),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
