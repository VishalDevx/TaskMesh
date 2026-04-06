import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Wilson',
      password: hashedPassword,
    },
  });

  console.log('Created users:', { user1: user1.id, user2: user2.id, user3: user3.id });

  const workspace1 = await prisma.workspace.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'Main workspace for Acme Corporation',
      members: {
        create: [
          { userId: user1.id, role: Role.OWNER },
          { userId: user2.id, role: Role.ADMIN },
          { userId: user3.id, role: Role.MEMBER },
        ],
      },
    },
  });

  const workspace2 = await prisma.workspace.upsert({
    where: { slug: 'startup-xyz' },
    update: {},
    create: {
      name: 'Startup XYZ',
      slug: 'startup-xyz',
      description: 'Workspace for Startup XYZ team',
      members: {
        create: [
          { userId: user2.id, role: Role.OWNER },
          { userId: user1.id, role: Role.MEMBER },
        ],
      },
    },
  });

  console.log('Created workspaces:', { workspace1: workspace1.id, workspace2: workspace2.id });

  const board1 = await prisma.board.upsert({
    where: { id: 'board-product-dev' },
    update: {},
    create: {
      id: 'board-product-dev',
      name: 'Product Development',
      description: 'Track product development tasks',
      color: '#6366f1',
      workspaceId: workspace1.id,
      position: 0,
      columns: {
        create: [
          { name: 'Backlog', position: 0 },
          { name: 'To Do', position: 1 },
          { name: 'In Progress', position: 2 },
          { name: 'Review', position: 3 },
          { name: 'Done', position: 4 },
        ],
      },
    },
  });

  const board2 = await prisma.board.upsert({
    where: { id: 'board-marketing' },
    update: {},
    create: {
      id: 'board-marketing',
      name: 'Marketing',
      description: 'Marketing campaigns and content',
      color: '#10b981',
      workspaceId: workspace1.id,
      position: 1,
      columns: {
        create: [
          { name: 'Ideas', position: 0 },
          { name: 'Planned', position: 1 },
          { name: 'In Progress', position: 2 },
          { name: 'Published', position: 3 },
        ],
      },
    },
  });

  console.log('Created boards:', { board1: board1.id, board2: board2.id });

  const columns = await prisma.column.findMany({
    where: { boardId: board1.id },
    orderBy: { position: 'asc' },
  });

  if (columns.length >= 3) {
    const backlogColumn = columns[0];
    const todoColumn = columns[1];
    const inProgressColumn = columns[2];

    const task1 = await prisma.task.create({
      data: {
        title: 'Design new dashboard layout',
        description: 'Create wireframes and mockups for the new dashboard design',
        priority: 'high',
        columnId: todoColumn.id,
        creatorId: user1.id,
        assigneeId: user2.id,
        position: 0,
      },
    });

    const task2 = await prisma.task.create({
      data: {
        title: 'Implement user authentication',
        description: 'Set up OAuth providers and session management',
        priority: 'high',
        columnId: inProgressColumn.id,
        creatorId: user1.id,
        assigneeId: user1.id,
        position: 0,
      },
    });

    const task3 = await prisma.task.create({
      data: {
        title: 'Write API documentation',
        description: 'Document all API endpoints using OpenAPI spec',
        priority: 'medium',
        columnId: backlogColumn.id,
        creatorId: user2.id,
        position: 0,
      },
    });

    const task4 = await prisma.task.create({
      data: {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        priority: 'medium',
        columnId: backlogColumn.id,
        creatorId: user1.id,
        assigneeId: user3.id,
        position: 1,
      },
    });

    const task5 = await prisma.task.create({
      data: {
        title: 'Database schema optimization',
        description: 'Review and optimize database queries and indexes',
        priority: 'low',
        columnId: backlogColumn.id,
        creatorId: user2.id,
        position: 2,
      },
    });

    console.log('Created tasks');

    await prisma.comment.createMany({
      data: [
        {
          content: 'I can help with the wireframes! Let me know when you want to start.',
          taskId: task1.id,
          authorId: user3.id,
        },
        {
          content: 'Great progress on this! Should we schedule a review meeting?',
          taskId: task2.id,
          authorId: user2.id,
        },
        {
          content: 'I have some notes on the API structure, will share soon.',
          taskId: task3.id,
          authorId: user1.id,
        },
      ],
    });

    console.log('Created comments');
  }

  await prisma.notification.createMany({
    data: [
      {
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: 'You have been assigned to "Design new dashboard layout"',
        userId: user2.id,
        read: false,
      },
      {
        type: 'WORKSPACE_MEMBER_JOINED',
        title: 'New Member Joined',
        message: 'Jane Smith joined Acme Corp',
        userId: user1.id,
        read: true,
      },
    ],
  });

  console.log('Created notifications');

  await prisma.activityLog.createMany({
    data: [
      {
        action: 'WORKSPACE_CREATED',
        entityType: 'workspace',
        entityId: workspace1.id,
        userId: user1.id,
        workspaceId: workspace1.id,
      },
      {
        action: 'MEMBER_JOINED',
        entityType: 'workspace_member',
        entityId: user2.id,
        userId: user2.id,
        workspaceId: workspace1.id,
      },
      {
        action: 'BOARD_CREATED',
        entityType: 'board',
        entityId: board1.id,
        userId: user1.id,
        workspaceId: workspace1.id,
        boardId: board1.id,
      },
    ],
  });

  console.log('Created activity logs');

  console.log('Seed completed successfully!');
  console.log('\nTest accounts:');
  console.log('Email: john@example.com | Password: password123');
  console.log('Email: jane@example.com | Password: password123');
  console.log('Email: bob@example.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
