import prisma from '@/lib/prisma';
import { Role, InvitationStatus } from '@prisma/client';
import { generateToken } from '@/lib/utils';

export class InvitationRepository {
  async create(data: {
    email: string;
    workspaceId: string;
    role?: Role;
    senderId?: string;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.invitation.create({
      data: {
        email: data.email,
        workspaceId: data.workspaceId,
        role: data.role || Role.MEMBER,
        senderId: data.senderId,
        token: generateToken(),
        expiresAt,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        sender: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });
  }

  async findByToken(token: string) {
    return prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        sender: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return prisma.invitation.findMany({
      where: { workspaceId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        sender: {
          select: {
            name: true,
            image: true,
          },
        },
        recipient: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingByEmail(email: string) {
    return prisma.invitation.findMany({
      where: {
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        sender: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new Error('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { token },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new Error('Invitation has expired');
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new Error('Already a member');
    }

    await prisma.$transaction([
      prisma.invitation.update({
        where: { token },
        data: {
          status: InvitationStatus.ACCEPTED,
          recipientId: userId,
        },
      }),
      prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      }),
    ]);

    return invitation;
  }

  async reject(token: string, userId: string) {
    return prisma.invitation.update({
      where: { token },
      data: {
        status: InvitationStatus.REJECTED,
        recipientId: userId,
      },
    });
  }

  async delete(id: string) {
    return prisma.invitation.delete({
      where: { id },
    });
  }
}

export const invitationRepository = new InvitationRepository();
