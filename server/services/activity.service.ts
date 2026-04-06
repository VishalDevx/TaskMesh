import { ActivityAction, Prisma } from '@prisma/client';
import { activityRepository } from '@/server/repositories';

export class ActivityService {
  async log(
    action: ActivityAction,
    entityType: string,
    entityId: string,
    userId: string,
    workspaceId: string,
    metadata?: Prisma.InputJsonValue,
    taskId?: string,
    boardId?: string,
    commentId?: string
  ) {
    return activityRepository.create({
      action,
      entityType,
      entityId,
      userId,
      workspaceId,
      metadata,
      taskId,
      boardId,
      commentId,
    });
  }

  async getWorkspaceActivity(workspaceId: string, limit = 50, cursor?: string) {
    return activityRepository.findByWorkspace(workspaceId, limit, cursor);
  }

  async getTaskActivity(taskId: string) {
    return activityRepository.findByTask(taskId);
  }

  async getBoardActivity(boardId: string, limit = 50) {
    return activityRepository.findByBoard(boardId, limit);
  }

  async logWorkspaceCreated(workspaceId: string, userId: string, workspaceName: string) {
    return this.log(
      ActivityAction.WORKSPACE_CREATED,
      'workspace',
      workspaceId,
      userId,
      workspaceId,
      { workspaceName }
    );
  }

  async logMemberJoined(workspaceId: string, userId: string, memberId: string, memberName: string) {
    return this.log(
      ActivityAction.MEMBER_JOINED,
      'workspace_member',
      memberId,
      userId,
      workspaceId,
      { memberName }
    );
  }

  async logMemberRemoved(
    workspaceId: string,
    userId: string,
    memberId: string,
    memberName: string
  ) {
    return this.log(
      ActivityAction.MEMBER_REMOVED,
      'workspace_member',
      memberId,
      userId,
      workspaceId,
      { memberName }
    );
  }

  async logRoleChanged(workspaceId: string, userId: string, memberId: string, newRole: string) {
    return this.log(
      ActivityAction.ROLE_CHANGED,
      'workspace_member',
      memberId,
      userId,
      workspaceId,
      { newRole }
    );
  }

  async logBoardCreated(boardId: string, workspaceId: string, userId: string, boardName: string) {
    return this.log(
      ActivityAction.BOARD_CREATED,
      'board',
      boardId,
      userId,
      workspaceId,
      { boardName },
      undefined,
      boardId
    );
  }

  async logTaskCreated(taskId: string, workspaceId: string, userId: string, taskTitle: string) {
    return this.log(
      ActivityAction.TASK_CREATED,
      'task',
      taskId,
      userId,
      workspaceId,
      { taskTitle },
      taskId
    );
  }

  async logTaskMoved(
    taskId: string,
    workspaceId: string,
    userId: string,
    fromColumn: string,
    toColumn: string
  ) {
    return this.log(
      ActivityAction.TASK_MOVED,
      'task',
      taskId,
      userId,
      workspaceId,
      { fromColumn, toColumn },
      taskId
    );
  }

  async logTaskAssigned(
    taskId: string,
    workspaceId: string,
    userId: string,
    assigneeId: string,
    assigneeName: string
  ) {
    return this.log(
      ActivityAction.TASK_ASSIGNED,
      'task',
      taskId,
      userId,
      workspaceId,
      { assigneeId, assigneeName },
      taskId
    );
  }

  async logCommentAdded(commentId: string, taskId: string, workspaceId: string, userId: string) {
    return this.log(
      ActivityAction.COMMENT_ADDED,
      'comment',
      commentId,
      userId,
      workspaceId,
      {},
      taskId,
      undefined,
      commentId
    );
  }
}

export const activityService = new ActivityService();
