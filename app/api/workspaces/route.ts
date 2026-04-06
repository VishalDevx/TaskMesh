import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { workspaceRepository } from '@/server/repositories';
import { activityService } from '@/server/services';
import { createWorkspaceSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await workspaceRepository.findByUser(session.user.id);

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createWorkspaceSchema.parse(body);

    const workspace = await workspaceRepository.create({
      name: data.name,
      description: data.description,
      logo: data.logo,
      ownerId: session.user.id,
    });

    await activityService.logWorkspaceCreated(
      workspace.id,
      session.user.id,
      workspace.name
    );

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
