import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { slugify } from '@/lib/utils';

export class WorkspaceRepository {
  async create(data: { name: string; description?: string; logo?: string; ownerId: string }) {
    const slug = slugify(data.name);

    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    const finalSlug = existingWorkspace ? `${slug}-${Date.now()}` : slug;

    return prisma.workspace.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        logo: data.logo,
        owner: {
          connect: { id: data.ownerId },
        },
        members: {
          create: {
            userId: data.ownerId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            boards: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            boards: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            boards: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: { name?: string; description?: string; logo?: string }) {
    return prisma.workspace.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.workspace.delete({
      where: { id },
    });
  }

  async addMember(workspaceId: string, userId: string, role: Role = Role.MEMBER) {
    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  }

  async updateMemberRole(workspaceId: string, userId: string, role: Role) {
    return prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async getMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async getMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
}

export const workspaceRepository = new WorkspaceRepository();
