import prisma from '@/lib/prisma';
import { NotificationType, Prisma } from '@prisma/client';

export class NotificationRepository {
  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    data?: Prisma.InputJsonValue;
  }) {
    return prisma.notification.create({
      data,
    });
  }

  async findByUser(userId: string, limit = 50, cursor?: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });
  }

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id, userId },
    });
  }
}

export const notificationRepository = new NotificationRepository();
