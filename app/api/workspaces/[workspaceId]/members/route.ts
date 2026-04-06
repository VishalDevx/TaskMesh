import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { workspaceRepository, prisma } from '@/server/repositories';
import { rbacService, activityService } from '@/server/services';
import { updateMemberRoleSchema } from '@/lib/validations';
import { ZodError, Role } from 'zod';

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

    const members = await workspaceRepository.getMembers(params.workspaceId);

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const canManage = await rbacService.canManageMember(
      session.user.id,
      params.workspaceId,
      userId
    );
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = updateMemberRoleSchema.parse({ role });

    if (role === Role.OWNER) {
      return NextResponse.json(
        { error: 'Cannot assign owner role' },
        { status: 400 }
      );
    }

    const member = await workspaceRepository.updateMemberRole(
      params.workspaceId,
      userId,
      data.role
    );

    await activityService.logRoleChanged(
      params.workspaceId,
      session.user.id,
      userId,
      data.role
    );

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const canRemove = await rbacService.canManageMember(
      session.user.id,
      params.workspaceId,
      userId
    );
    if (!canRemove) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const memberToRemove = await workspaceRepository.getMember(params.workspaceId, userId);
    if (memberToRemove?.role === Role.OWNER) {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      );
    }

    await workspaceRepository.removeMember(params.workspaceId, userId);

    await activityService.logMemberRemoved(
      params.workspaceId,
      session.user.id,
      userId,
      memberToRemove?.user.name || 'Member'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
