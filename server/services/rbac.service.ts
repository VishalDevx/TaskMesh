import { Role } from '@prisma/client';
import { workspaceRepository } from '@/server/repositories';

export type Permission =
  | 'workspace:update'
  | 'workspace:delete'
  | 'workspace:invite'
  | 'workspace:manage_members'
  | 'workspace:remove_members'
  | 'workspace:update_roles'
  | 'board:create'
  | 'board:update'
  | 'board:delete'
  | 'board:reorder'
  | 'column:create'
  | 'column:update'
  | 'column:delete'
  | 'task:create'
  | 'task:update'
  | 'task:delete'
  | 'task:move'
  | 'task:assign';

const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    'workspace:update',
    'workspace:delete',
    'workspace:invite',
    'workspace:manage_members',
    'workspace:remove_members',
    'workspace:update_roles',
    'board:create',
    'board:update',
    'board:delete',
    'board:reorder',
    'column:create',
    'column:update',
    'column:delete',
    'task:create',
    'task:update',
    'task:delete',
    'task:move',
    'task:assign',
  ],
  ADMIN: [
    'workspace:update',
    'workspace:invite',
    'workspace:manage_members',
    'board:create',
    'board:update',
    'board:reorder',
    'column:create',
    'column:update',
    'column:delete',
    'task:create',
    'task:update',
    'task:delete',
    'task:move',
    'task:assign',
  ],
  MEMBER: [
    'board:update',
    'task:create',
    'task:update',
    'task:move',
    'task:assign',
  ],
};

export class RBACService {
  async hasPermission(userId: string, workspaceId: string, permission: Permission): Promise<boolean> {
    const member = await workspaceRepository.getMember(workspaceId, userId);
    if (!member) return false;

    return rolePermissions[member.role].includes(permission);
  }

  async getUserRole(userId: string, workspaceId: string): Promise<Role | null> {
    const member = await workspaceRepository.getMember(workspaceId, userId);
    return member?.role ?? null;
  }

  async isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
    const member = await workspaceRepository.getMember(workspaceId, userId);
    return !!member;
  }

  async canManageMember(userId: string, workspaceId: string, targetUserId: string): Promise<boolean> {
    if (userId === targetUserId) return false;

    const userRole = await this.getUserRole(userId, workspaceId);
    if (!userRole) return false;

    if (userRole === Role.OWNER) return true;
    if (userRole === Role.ADMIN) {
      const targetRole = await this.getUserRole(targetUserId, workspaceId);
      return targetRole !== Role.OWNER && targetRole !== Role.ADMIN;
    }

    return false;
  }

  async canDeleteWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    const member = await workspaceRepository.getMember(workspaceId, userId);
    return member?.role === Role.OWNER;
  }

  getPermissionsForRole(role: Role): Permission[] {
    return rolePermissions[role];
  }
}

export const rbacService = new RBACService();
