import prisma from '@/lib/prisma';

export class CommentRepository {
  async create(data: { content: string; taskId: string; authorId: string }) {
    const mentions = this.extractMentions(data.content);

    return prisma.comment.create({
      data: {
        content: data.content,
        taskId: data.taskId,
        authorId: data.authorId,
        mentions,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        task: {
          select: {
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
        },
      },
    });
  }

  async findByTask(taskId: string) {
    return prisma.comment.findMany({
      where: { taskId },
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
    });
  }

  async update(id: string, content: string) {
    const mentions = this.extractMentions(content);

    return prisma.comment.update({
      where: { id },
      data: { content, mentions },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.comment.delete({
      where: { id },
    });
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]);
    }

    return mentions;
  }
}

export const commentRepository = new CommentRepository();
