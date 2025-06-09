
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Edit, Trash2, XCircle, Bookmark } from "lucide-react";
import type { ChapterItem } from '@/lib/types';
import { format } from 'date-fns';

export default function ManageChaptersPage() {
  const [newItemName, setNewItemName] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [items, setItems] = useState<ChapterItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [currentEditName, setCurrentEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const entityName = "Chapter";
  const entityApiPrefix = "chapters";
  const entityIcon = Bookmark;

  const fetchItems = async () => {
    setIsLoadingItems(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/${entityApiPrefix}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch ${entityName.toLowerCase()}s`);
      }
      const data: ChapterItem[] = await response.json();
      setItems(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error(`Failed to fetch ${entityName.toLowerCase()}s:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setFetchError(errorMessage);
      toast({ title: `Error Fetching ${entityName}s`, description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast({
        title: `${entityName} Name Required`,
        description: `Please enter a name for the new ${entityName.toLowerCase()}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingNew(true);
    try {
      const response = await fetch(`/api/${entityApiPrefix}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim() }),
      });
      const result = await response.json();

      if (response.ok) {
        toast({ title: `${entityName} Created`, description: `${entityName} "${result.name || newItemName.trim().toUpperCase()}" added successfully.` });
        setNewItemName('');
        fetchItems(); 
      } else {
        toast({ title: `Error Creating ${entityName}`, description: result.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error(`Failed to create ${entityName.toLowerCase()}:`, error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleEditClick = (item: ChapterItem) => {
    setEditingItemId(item._id);
    setCurrentEditName(item.name);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setCurrentEditName('');
  };

  const handleUpdateSubmit = async (itemId: string) => {
    if (!currentEditName.trim()) {
      toast({ title: `${entityName} Name Required`, description: `${entityName} name cannot be empty.`, variant: "destructive" });
      return;
    }
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/${entityApiPrefix}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentEditName.trim() }),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: `${entityName} Updated`, description: `${entityName} updated to "${result.newName}".` });
        setEditingItemId(null);
        setCurrentEditName('');
        fetchItems(); 
      } else {
        toast({ title: `Error Updating ${entityName}`, description: result.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error(`Failed to update ${entityName.toLowerCase()}:`, error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDeleteId(itemId);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/${entityApiPrefix}/${itemToDeleteId}`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok) {
        toast({ title: `${entityName} Deleted`, description: result.message });
        fetchItems(); 
      } else {
        toast({ title: `Error Deleting ${entityName}`, description: result.message || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error(`Failed to delete ${entityName.toLowerCase()}:`, error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setItemToDeleteId(null);
    }
  };

  const EntityIconComponent = entityIcon;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center">
        <EntityIconComponent className="mr-3 h-8 w-8" /> Create & Manage {entityName}s
      </h1>
      
      <Card className="shadow-lg max-w-2xl">
        <form onSubmit={handleCreateSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Create New {entityName}</CardTitle>
            <CardDescription>Enter a name for your new {entityName.toLowerCase()}. It will be saved in uppercase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newItemName" className="font-semibold">New {entityName} Name</Label>
              <Input
                id="newItemName"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`e.g., Thermodynamics`}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmittingNew} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              {isSubmittingNew ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save New {entityName}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Existing {entityName}s</CardTitle>
          <CardDescription>View, edit, or delete existing {entityName.toLowerCase()}s. Sorted by creation date (newest first).</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingItems && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading {entityName.toLowerCase()}s...</p>
            </div>
          )}
          {!isLoadingItems && fetchError && (
            <div className="text-center py-10 text-destructive">
              <p>Error: {fetchError}</p>
              <p>Please try refreshing the page.</p>
            </div>
          )}
          {!isLoadingItems && !fetchError && items.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No {entityName.toLowerCase()}s found. Create one above to get started!</p>
          )}
          {!isLoadingItems && !fetchError && items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{entityName} Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      {editingItemId === item._id ? (
                        <Input
                          value={currentEditName}
                          onChange={(e) => setCurrentEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(item.createdAt), 'PPp')}</TableCell>
                    <TableCell>{item.updatedAt ? format(new Date(item.updatedAt), 'PPp') : 'N/A'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {editingItemId === item._id ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleUpdateSubmit(item._id)} 
                            disabled={isUpdating}
                            className="hover:bg-green-100 dark:hover:bg-green-800"
                            aria-label={`Update ${entityName.toLowerCase()} name`}
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-600 dark:text-green-400" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleCancelEdit} 
                            disabled={isUpdating}
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Cancel edit"
                          >
                            <XCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditClick(item)}
                            className="hover:bg-accent/50"
                            aria-label={`Edit ${entityName.toLowerCase()} name`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteClick(item._id)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${entityName.toLowerCase()}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {itemToDeleteId && (
        <AlertDialog open={!!itemToDeleteId} onOpenChange={() => setItemToDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this {entityName.toLowerCase()}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {entityName.toLowerCase()} named 
                <span className="font-semibold"> "{items.find(i => i._id === itemToDeleteId)?.name}"</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDeleteId(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete {entityName}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
