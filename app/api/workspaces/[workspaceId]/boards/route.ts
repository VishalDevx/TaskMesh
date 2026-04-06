import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { boardRepository, workspaceRepository } from '@/server/repositories';
import { rbacService, activityService } from '@/server/services';
import { createBoardSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
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

    const boards = await boardRepository.findByWorkspace(params.workspaceId);

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canCreate = await rbacService.hasPermission(
      session.user.id,
      params.workspaceId,
      'board:create'
    );
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createBoardSchema.parse(body);

    const board = await boardRepository.create({
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      workspaceId: params.workspaceId,
    });

    await activityService.logBoardCreated(
      board.id,
      params.workspaceId,
      session.user.id,
      board.name
    );

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
