'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspaces, useCreateWorkspace } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Users, LayoutGrid, Loader2 } from 'lucide-react';

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    await createWorkspace.mutateAsync({ name: newWorkspaceName });
    setNewWorkspaceName('');
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Workspace</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new workspace</DialogTitle>
                <DialogDescription>
                  Workspaces help you organize your team and projects.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div>
                  <label htmlFor="workspace-name" className="text-sm font-medium">
                    Workspace name
                  </label>
                  <Input
                    id="workspace-name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="My awesome team"
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createWorkspace.isPending}>
                  {createWorkspace.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create workspace
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Your Workspaces</h1>

        {workspaces?.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-12 text-center">
            <LayoutGrid className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No workspaces yet</h2>
            <p className="mb-6 text-muted-foreground">
              Create your first workspace to start collaborating with your team.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces?.map((workspace: any) => (
              <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                        {workspace.logo ? (
                          <img
                            src={workspace.logo}
                            alt={workspace.name}
                            className="h-8 w-8 rounded"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {workspace.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-4">{workspace.name}</CardTitle>
                    <CardDescription>
                      {workspace.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {workspace._count?.members || workspace.members?.length || 0} members
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" />
                        {workspace._count?.boards || 0} boards
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {workspace.members?.slice(0, 3).map((member: any) => (
                        <Badge key={member.id} variant="secondary">
                          {member.user.name || member.user.email}
                        </Badge>
                      ))}
                      {(workspace.members?.length || 0) > 3 && (
                        <Badge variant="outline">
                          +{(workspace.members?.length || 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
