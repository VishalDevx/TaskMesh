import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { invitationRepository } from '@/server/repositories';
import { activityService } from '@/server/services';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await invitationRepository.findByToken(params.token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'accept') {
      const invitation = await invitationRepository.accept(params.token, session.user.id);

      await activityService.logMemberJoined(
        invitation.workspaceId,
        session.user.id,
        session.user.id,
        session.user.name || 'New member'
      );

      return NextResponse.json({ success: true, status: 'accepted' });
    } else if (action === 'reject') {
      await invitationRepository.reject(params.token, session.user.id);
      return NextResponse.json({ success: true, status: 'rejected' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling invitation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
