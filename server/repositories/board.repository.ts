import prisma from '@/lib/prisma';

export class BoardRepository {
  async create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    workspaceId: string;
  }) {
    const lastBoard = await prisma.board.findFirst({
      where: { workspaceId: data.workspaceId },
      orderBy: { position: 'desc' },
    });

    const position = lastBoard ? lastBoard.position + 1 : 0;

    return prisma.board.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        workspaceId: data.workspaceId,
        position,
        columns: {
          create: [
            { name: 'To Do', position: 0 },
            { name: 'In Progress', position: 1 },
            { name: 'Done', position: 2 },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                _count: {
                  select: { comments: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                creator: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                _count: {
                  select: { comments: true },
                },
              },
            },
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return prisma.board.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: {
            columns: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      icon?: string | null;
      color?: string | null;
    }
  ) {
    return prisma.board.update({
      where: { id },
      data,
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.board.delete({
      where: { id },
    });
  }

  async reorder(id: string, newPosition: number) {
    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) throw new Error('Board not found');

    await prisma.$transaction([
      prisma.board.updateMany({
        where: {
          workspaceId: board.workspaceId,
          position: { gte: newPosition },
          id: { not: id },
        },
        data: { position: { increment: 1 } },
      }),
      prisma.board.update({
        where: { id },
        data: { position: newPosition },
      }),
    ]);

    return this.findById(id);
  }
}

export const boardRepository = new BoardRepository();
