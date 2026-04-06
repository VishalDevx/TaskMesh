'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace, useBoards, useCreateBoard, useWorkspaceMembers } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  LayoutGrid,
  Settings,
  Users,
  ArrowLeft,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: boards, isLoading: boardsLoading } = useBoards(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const createBoard = useCreateBoard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    const board = await createBoard.mutateAsync({
      workspaceId,
      data: { name: newBoardName },
    });
    setNewBoardName('');
    setIsDialogOpen(false);
    router.push(`/workspaces/${workspaceId}/boards/${board.id}`);
  };

  if (workspaceLoading || boardsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/workspaces"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                {workspace.logo ? (
                  <img src={workspace.logo} alt={workspace.name} className="h-6 w-6 rounded" />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {workspace.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xl font-bold">{workspace.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  {members?.length || 0}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Team Members</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {members?.map((member: any) => (
                  <DropdownMenuItem key={member.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.user.image} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.user.name || member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">{member.user.name || member.user.email}</span>
                      <span className="text-xs text-muted-foreground">{member.role}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href={`/workspaces/${workspaceId}/settings`}>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a new board</DialogTitle>
                  <DialogDescription>
                    Boards help you organize tasks within your workspace.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBoard} className="space-y-4">
                  <div>
                    <label htmlFor="board-name" className="text-sm font-medium">
                      Board name
                    </label>
                    <Input
                      id="board-name"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      placeholder="e.g., Marketing, Product Roadmap"
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createBoard.isPending}>
                    {createBoard.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create board
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Boards</h1>

        {boards?.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-12 text-center">
            <LayoutGrid className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No boards yet</h2>
            <p className="mb-6 text-muted-foreground">
              Create your first board to start managing tasks with your team.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create board
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards?.map((board: any) => (
              <Link key={board.id} href={`/workspaces/${workspaceId}/boards/${board.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: board.color || '#6366f1' }}
                      >
                        <span className="text-lg font-bold text-white">
                          {board.icon || board.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="mt-2">{board.name}</CardTitle>
                    <CardDescription>
                      {board.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{board._count?.columns || 0} columns</span>
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
