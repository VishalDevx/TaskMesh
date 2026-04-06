import prisma from '@/lib/prisma';

export class ColumnRepository {
  async create(data: { name: string; color?: string; boardId: string }) {
    const lastColumn = await prisma.column.findFirst({
      where: { boardId: data.boardId },
      orderBy: { position: 'desc' },
    });

    const position = lastColumn ? lastColumn.position + 1 : 0;

    return prisma.column.create({
      data: {
        name: data.name,
        color: data.color,
        boardId: data.boardId,
        position,
      },
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
    });
  }

  async findById(id: string) {
    return prisma.column.findUnique({
      where: { id },
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
    });
  }

  async update(id: string, data: { name?: string; color?: string }) {
    return prisma.column.update({
      where: { id },
      data,
      include: {
        tasks: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.column.delete({
      where: { id },
    });
  }

  async reorder(id: string, newPosition: number) {
    const column = await prisma.column.findUnique({ where: { id } });
    if (!column) throw new Error('Column not found');

    await prisma.$transaction([
      prisma.column.updateMany({
        where: {
          boardId: column.boardId,
          position: { gte: newPosition },
          id: { not: id },
        },
        data: { position: { increment: 1 } },
      }),
      prisma.column.update({
        where: { id },
        data: { position: newPosition },
      }),
    ]);

    return this.findById(id);
  }
}

export const columnRepository = new ColumnRepository();
