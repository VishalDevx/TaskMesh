import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { boardRepository, columnRepository, taskRepository, workspaceRepository } from '@/server/repositories';
import { rbacService } from '@/server/services';
import { updateBoardSchema, createColumnSchema, createTaskSchema, moveTaskSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; boardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isMember = await rbacService.isWorkspaceMember(
      session.user.id,
      params.workspaceId
    );
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const board = await boardRepository.findById(params.boardId);
    if (!board || board.workspaceId !== params.workspaceId) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string; boardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canUpdate = await rbacService.hasPermission(
      session.user.id,
      params.workspaceId,
      'board:update'
    );
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'column') {
      const data = createColumnSchema.parse(body.data);
      const column = await columnRepository.create({
        name: data.name,
        color: data.color,
        boardId: params.boardId,
      });
      return NextResponse.json(column);
    }

    const data = updateBoardSchema.parse(body);
    const board = await boardRepository.update(params.boardId, {
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
    });

    return NextResponse.json(board);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; boardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canDelete = await rbacService.hasPermission(
      session.user.id,
      params.workspaceId,
      'board:delete'
    );
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await boardRepository.delete(params.boardId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
