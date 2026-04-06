import { NotificationType, Prisma } from '@prisma/client';
import { notificationRepository } from '@/server/repositories';
import prisma from '@/lib/prisma';

export class NotificationService {
  async create(
    type: NotificationType,
    title: string,
    message: string,
    userId: string,
    data?: Prisma.InputJsonValue
  ) {
    return notificationRepository.create({ type, title, message, userId, data });
  }

  async getUserNotifications(userId: string, limit = 50, cursor?: string) {
    return notificationRepository.findByUser(userId, limit, cursor);
  }

  async getUnreadCount(userId: string) {
    return notificationRepository.countUnread(userId);
  }

  async markAsRead(id: string, userId: string) {
    return notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string) {
    return notificationRepository.delete(id, userId);
  }

  async notifyWorkspaceInvitation(
    recipientId: string,
    workspaceName: string,
    inviterName: string | null,
    workspaceId: string
  ) {
    return this.create(
      NotificationType.WORKSPACE_INVITATION,
      'Workspace Invitation',
      `${inviterName || 'Someone'} invited you to join ${workspaceName}`,
      recipientId,
      { workspaceId, type: 'invitation' }
    );
  }

  async notifyMemberJoined(workspaceId: string, memberName: string, memberId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { role: { in: ['OWNER', 'ADMIN'] } },
          select: { userId: true },
        },
      },
    });

    if (!workspace) return;

    const notifications = workspace.members.map((member) =>
      this.create(
        NotificationType.WORKSPACE_MEMBER_JOINED,
        'New Member Joined',
        `${memberName} joined ${workspace.name}`,
        member.userId,
        { workspaceId, memberId }
      )
    );

    return Promise.all(notifications);
  }

  async notifyTaskAssigned(
    assigneeId: string,
    taskTitle: string,
    assignerName: string,
    taskId: string,
    workspaceId: string
  ) {
    return this.create(
      NotificationType.TASK_ASSIGNED,
      'Task Assigned',
      `${assignerName} assigned you to "${taskTitle}"`,
      assigneeId,
      { taskId, workspaceId, type: 'task_assigned' }
    );
  }

  async notifyTaskMention(
    userId: string,
    taskTitle: string,
    mentionerName: string,
    taskId: string,
    workspaceId: string
  ) {
    return this.create(
      NotificationType.TASK_MENTION,
      'You were mentioned',
      `${mentionerName} mentioned you in "${taskTitle}"`,
      userId,
      { taskId, workspaceId, type: 'mention' }
    );
  }

  async notifyCommentMention(
    userId: string,
    taskTitle: string,
    mentionerName: string,
    taskId: string,
    workspaceId: string
  ) {
    return this.create(
      NotificationType.COMMENT_MENTION,
      'You were mentioned',
      `${mentionerName} mentioned you in a comment on "${taskTitle}"`,
      userId,
      { taskId, workspaceId, type: 'mention' }
    );
  }

  async notifyBoardCreated(workspaceId: string, boardName: string, creatorId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: {
            userId: { not: creatorId },
            role: { in: ['OWNER', 'ADMIN'] },
          },
          select: { userId: true },
        },
      },
    });

    if (!workspace) return;

    const notifications = workspace.members.map((member) =>
      this.create(
        NotificationType.BOARD_CREATED,
        'New Board Created',
        `A new board "${boardName}" was created in ${workspace.name}`,
        member.userId,
        { workspaceId, type: 'board_created' }
      )
    );

    return Promise.all(notifications);
  }
}

export const notificationService = new NotificationService();
