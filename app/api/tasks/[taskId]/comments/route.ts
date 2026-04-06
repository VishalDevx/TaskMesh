import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { commentRepository, taskRepository, workspaceRepository } from '@/server/repositories';
import { activityService, notificationService } from '@/server/services';
import { createCommentSchema, updateCommentSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(
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

    const body = await request.json();
    const data = createCommentSchema.parse(body);

    const comment = await commentRepository.create({
      content: data.content,
      taskId: params.taskId,
      authorId: session.user.id,
    });

    await activityService.logCommentAdded(
      comment.id,
      params.taskId,
      task.column.board.workspaceId,
      session.user.id
    );

    if (comment.mentions.length > 0) {
      for (const mentionedUserId of comment.mentions) {
        if (mentionedUserId !== session.user.id) {
          await notificationService.notifyCommentMention(
            mentionedUserId,
            task.title,
            session.user.name || 'Someone',
            params.taskId,
            task.column.board.workspaceId
          );
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
