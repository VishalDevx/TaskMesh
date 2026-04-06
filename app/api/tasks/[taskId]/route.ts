import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { taskRepository, boardRepository, workspaceRepository } from '@/server/repositories';
import { rbacService, activityService, notificationService } from '@/server/services';
import { createTaskSchema, updateTaskSchema, moveTaskSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await taskRepository.findById(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const isMember = await rbacService.isWorkspaceMember(
      session.user.id,
      task.column.board.workspaceId
    );
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await taskRepository.findById(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const canUpdate = await rbacService.hasPermission(
      session.user.id,
      task.column.board.workspaceId,
      'task:update'
    );
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (body.action === 'move') {
      const data = moveTaskSchema.parse(body);
      const movedTask = await taskRepository.move(
        data.taskId,
        data.destinationColumnId,
        data.newPosition,
        session.user.id
      );

      await activityService.logTaskMoved(
        data.taskId,
        task.column.board.workspaceId,
        session.user.id,
        data.sourceColumnId,
        data.destinationColumnId
      );

      return NextResponse.json(movedTask);
    }

    const data = updateTaskSchema.parse(body);
    const previousAssigneeId = task.assigneeId;

    const updatedTask = await taskRepository.update(params.taskId, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      assigneeId: data.assigneeId,
      updaterId: session.user.id,
    });

    if (data.assigneeId && data.assigneeId !== previousAssigneeId) {
      const assignee = await workspaceRepository.getMember(
        task.column.board.workspaceId,
        data.assigneeId
      );
      if (assignee) {
        await activityService.logTaskAssigned(
          params.taskId,
          task.column.board.workspaceId,
          session.user.id,
          data.assigneeId,
          assignee.user.name || 'Unknown'
        );

        await notificationService.notifyTaskAssigned(
          data.assigneeId,
          updatedTask.title,
          session.user.name || 'Someone',
          params.taskId,
          task.column.board.workspaceId
        );
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await taskRepository.findById(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const canDelete = await rbacService.hasPermission(
      session.user.id,
      task.column.board.workspaceId,
      'task:delete'
    );
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await taskRepository.delete(params.taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
