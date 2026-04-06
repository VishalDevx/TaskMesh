import prisma from '@/lib/prisma';

export class TaskRepository {
  async create(data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: Date;
    assigneeId?: string;
    columnId: string;
    creatorId: string;
  }) {
    const lastTask = await prisma.task.findFirst({
      where: { columnId: data.columnId },
      orderBy: { position: 'desc' },
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        columnId: data.columnId,
        creatorId: data.creatorId,
        position,
      },
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
    });
  }

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
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
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        column: {
          include: {
            board: {
              select: {
                id: true,
                workspaceId: true,
              },
            },
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: Date | null;
      assigneeId?: string | null;
      updaterId: string;
    }
  ) {
    return prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        assigneeId: data.assigneeId,
        updaterId: data.updaterId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        column: {
          include: {
            board: {
              select: {
                id: true,
                workspaceId: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        column: {
          select: {
            board: {
              select: {
                id: true,
                workspaceId: true,
              },
            },
          },
        },
      },
    });

    await prisma.task.delete({ where: { id } });

    return task;
  }

  async move(id: string, destinationColumnId: string, newPosition: number, userId: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new Error('Task not found');

    const sourceColumnId = task.columnId;

    await prisma.$transaction(async (tx) => {
      if (sourceColumnId === destinationColumnId) {
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            position: { gte: task.position, not: task.id },
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });
      } else {
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            position: { gt: task.position },
          },
          data: { position: { decrement: 1 } },
        });

        await tx.task.updateMany({
          where: {
            columnId: destinationColumnId,
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      await tx.task.update({
        where: { id },
        data: {
          columnId: destinationColumnId,
          position: newPosition,
          updaterId: userId,
        },
      });
    });

    return this.findById(id);
  }

  async reorderInColumn(columnId: string, taskId: string, newPosition: number) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    await prisma.$transaction(async (tx) => {
      if (task.position < newPosition) {
        await tx.task.updateMany({
          where: {
            columnId,
            position: { gt: task.position, lte: newPosition },
            id: { not: taskId },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        await tx.task.updateMany({
          where: {
            columnId,
            position: { gte: newPosition, lt: task.position },
            id: { not: taskId },
          },
          data: { position: { increment: 1 } },
        });
      }

      await tx.task.update({
        where: { id: taskId },
        data: { position: newPosition },
      });
    });

    return this.findById(taskId);
  }
}

export const taskRepository = new TaskRepository();
