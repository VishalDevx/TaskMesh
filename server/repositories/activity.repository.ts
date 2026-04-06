import prisma from '@/lib/prisma';
import { ActivityAction } from '@prisma/client';

export class ActivityRepository {
  async create(data: {
    action: ActivityAction;
    entityType: string;
    entityId: string;
    userId: string;
    workspaceId: string;
    metadata?: Record<string, unknown>;
    taskId?: string;
    boardId?: string;
    commentId?: string;
  }) {
    return prisma.activityLog.create({
      data,
    });
  }

  async findByWorkspace(workspaceId: string, limit = 50, cursor?: string) {
    return prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  async findByTask(taskId: string) {
    return prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  async findByBoard(boardId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }
}

export const activityRepository = new ActivityRepository();
