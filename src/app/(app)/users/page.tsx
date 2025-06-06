
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
import type { User } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch users: ${response.statusText}`);
        }
        const data: User[] = await response.json();
        setUsers(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          toast({ title: "Error fetching users", description: err.message, variant: "destructive" });
        } else {
          setError("An unknown error occurred");
          toast({ title: "Error fetching users", description: "An unknown error occurred.", variant: "destructive" });
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [toast]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      setUsers(prevUsers => prevUsers.filter(u => u._id !== userToDelete._id));
      toast({ title: "User Deleted", description: `User "${userToDelete.name}" has been removed.` });
    } catch (err) {
      if (err instanceof Error) {
        toast({ title: "Error deleting user", description: err.message, variant: "destructive" });
      } else {
        toast({ title: "Error deleting user", description: "An unknown error occurred.", variant: "destructive" });
      }
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const escapeCsvField = (field: string | undefined | null | Date): string => {
    if (field === null || field === undefined) {
      return '""';
    }
    const stringField = field instanceof Date ? field.toLocaleDateString() : String(field);
    return `"${stringField.replace(/"/g, '""')}"`;
  };

  const handleDownloadCSV = () => {
    if (users.length === 0) {
      toast({ title: "No Data", description: "There are no users to download.", variant: "destructive" });
      return;
    }
    const headers = ['Name', 'Email', 'Mobile Number', 'Joined Date', 'Last Login'];
    const csvRows = [
      headers.join(','),
      ...users.map(user => [
        escapeCsvField(user.name),
        escapeCsvField(user.email),
        escapeCsvField(user.mobileNumber),
        escapeCsvField(user.joinedDate),
        escapeCsvField(user.lastLogin),
      ].join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_list.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: "User list has been downloaded as CSV." });
  };

  const handleDownloadPDF = () => {
    if (users.length === 0) {
      toast({ title: "No Data", description: "There are no users to download.", variant: "destructive" });
      return;
    }
    const doc = new jsPDF();
    const tableColumn = ["Name", "Email", "Mobile Number", "Joined Date", "Last Login"];
    const tableRows: (string | null | undefined)[][] = [];

    users.forEach(user => {
      const userData = [
        user.name,
        user.email,
        user.mobileNumber || 'N/A',
        user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'N/A',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A',
      ];
      tableRows.push(userData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.text("User List", 14, 15);
    doc.save("user_list.pdf");
    toast({ title: "PDF Downloaded", description: "User list has been downloaded as PDF." });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto my-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive font-headline">Error Loading Users</CardTitle>
          <CardDescription>There was a problem fetching user data.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/10 p-4 rounded-md">{error}</p>
        </CardContent>
      </Card>
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
            <p className="text-center text-muted-foreground py-10">No users found in the database. You can add users directly to your MongoDB 'users' collection.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.mobileNumber || 'N/A'}</TableCell>
                    <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                    <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setUserToDelete(user)}
                        aria-label="Delete user"
                        disabled={isDeleting && userToDelete?._id === user._id}
                      >
                        {isDeleting && userToDelete?._id === user._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

