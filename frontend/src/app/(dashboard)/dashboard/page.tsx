"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FolderPlus, 
  Folder, 
  Trash2, 
  Edit3, 
  Loader2, 
  Calendar, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

interface Deal {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // TanStack Queries
  const { data: deals, isLoading, isError, error } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: () => api.get("/deals"),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; status: string }) =>
      api.post("/deals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setCreateOpen(false);
      setName("");
      setDescription("");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string; status: string } }) =>
      api.patch(`/deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setEditOpen(false);
      setSelectedDeal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setDeleteOpen(false);
      setSelectedDeal(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, description, status });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !name.trim()) return;
    editMutation.mutate({
      id: selectedDeal.id,
      data: { name, description, status },
    });
  };

  const openEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setName(deal.name);
    setDescription(deal.description || "");
    setStatus(deal.status);
    setEditOpen(true);
  };

  const openDelete = (deal: Deal) => {
    setSelectedDeal(deal);
    setDeleteOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h3 className="text-lg font-semibold">Failed to load workspaces</h3>
        <p className="text-sm text-muted-foreground">{(error as any)?.message || "Network Error"}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["deals"] })} variant="outline" size="sm" className="mt-2">
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Deal Workspaces
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your due diligence workspaces and transactions
          </p>
        </div>
        <Button
          onClick={() => {
            setName("");
            setDescription("");
            setStatus("active");
            setCreateOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="animate-pulse border-border/20 bg-card/15">
              <div className="p-6 space-y-4">
                <div className="h-5 w-2/3 bg-muted rounded-md" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-muted rounded-md" />
                  <div className="h-3.5 w-5/6 bg-muted rounded-md" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 w-1/4 bg-muted rounded-md" />
                  <div className="h-4 w-1/3 bg-muted rounded-md" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : deals && deals.length > 0 ? (
        /* Deals Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Card key={deal.id} className="relative group flex flex-col justify-between border-border/25 bg-card/10 hover:bg-card/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Folder className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    deal.status === "active" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-muted-foreground/10 text-muted-foreground border border-border/40"
                  }`}>
                    {deal.status}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors mt-3">
                  {deal.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {deal.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              
              <CardFooter className="flex items-center justify-between border-t border-border/10 py-3 text-[11px] text-muted-foreground mt-auto bg-card/5 rounded-b-2xl">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(deal.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(deal)}
                    className="p-1 rounded-md border border-border/40 hover:bg-muted/30 hover:text-foreground transition-all cursor-pointer"
                    title="Edit Deal"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => openDelete(deal)}
                    className="p-1 rounded-md border border-border/40 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
                    title="Delete Deal"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center border-dashed border-border/50 py-16 px-4 bg-card/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Folder className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-foreground">No deals created yet</h3>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
            Create your first deal workspace to begin uploading and analyzing financial files.
          </p>
          <Button
            onClick={() => {
              setName("");
              setDescription("");
              setStatus("active");
              setCreateOpen(true);
            }}
            variant="outline"
            className="mt-6 h-8 text-xs px-4"
          >
            Create first deal
          </Button>
        </Card>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Deal Workspace</DialogTitle>
            <DialogDescription>
              Create a new deal container to organize financial records.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Deal Name</Label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Aurora Acquisitions"
                required
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Due diligence review files for Q3 acquisition targets"
                disabled={createMutation.isPending}
              />
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm" disabled={createMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Deal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deal Workspace</DialogTitle>
            <DialogDescription>
              Modify deal information or archive this workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Deal Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={editMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={editMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Workspace Status</Label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-9 w-full rounded-lg border border-border bg-input px-3 py-1 text-sm shadow-sm transition-all focus:outline-none focus:border-primary/50 text-foreground"
                disabled={editMutation.isPending}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm" disabled={editMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={editMutation.isPending}>
                {editMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Deal Workspace?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedDeal?.name}</strong>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={deleteMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => selectedDeal && deleteMutation.mutate(selectedDeal.id)}
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanent"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
