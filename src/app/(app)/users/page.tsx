
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Trash2, Download, Users as UsersIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  joinedDate: string;
  lastLogin: string;
};

// Mock user data - in a real app, this would come from an API
const mockUsers: User[] = [
  { id: '1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'Admin', joinedDate: '2023-01-15', lastLogin: '2024-07-15' },
  { id: '2', name: 'Bob The Builder', email: 'bob@example.com', role: 'Editor', joinedDate: '2023-02-20', lastLogin: '2024-07-14' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer', joinedDate: '2023-03-10', lastLogin: '2024-07-10' },
  { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Editor', joinedDate: '2023-04-05', lastLogin: '2024-07-15' },
  { id: '5', name: 'Edward Scissorhands', email: 'edward@example.com', role: 'Viewer', joinedDate: '2023-05-25', lastLogin: '2024-06-20' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setUsers(mockUsers);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    // Simulate API call for deletion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
    toast({ title: "User Deleted", description: `User "${userToDelete.name}" has been removed.` });
    
    setIsDeleting(false);
    setUserToDelete(null);
  };

  const handleDownloadCSV = () => {
    toast({ title: "Download CSV", description: "CSV download functionality is not yet implemented." });
    // In a real app, you would generate and trigger a CSV download here
    console.log("Download CSV clicked. Data:", users);
  };

  const handleDownloadPDF = () => {
    toast({ title: "Download PDF", description: "PDF download functionality is not yet implemented." });
    // In a real app, you would generate and trigger a PDF download here
    console.log("Download PDF clicked. Data:", users);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary flex items-center">
          <UsersIcon className="mr-3 h-8 w-8" /> User Management
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleDownloadCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">User List</CardTitle>
          <CardDescription>View and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span 
                        className={`px-2 py-1 text-xs font-semibold rounded-full
                          ${user.role === 'Admin' ? 'bg-primary/20 text-primary-foreground' : 
                            user.role === 'Editor' ? 'bg-accent/20 text-accent-foreground' :
                            'bg-secondary text-secondary-foreground'
                          }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setUserToDelete(user)}
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the user 
                <span className="font-semibold"> "{userToDelete.name}"</span> from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
