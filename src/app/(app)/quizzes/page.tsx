import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListFilter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

// Mock data for quizzes
const mockQuizzes = [
  { id: "1", title: "Physics Mock Test 1", type: "Mock Test", subject: "Physics", questions: 10, status: "Published" },
  { id: "2", title: "NEET PYQ 2023", type: "Previous Year", subject: "Biology", questions: 20, status: "Draft" },
  { id: "3", title: "Chemistry Chapter 5 Practice", type: "Practice Test", subject: "Chemistry", questions: 15, status: "Published" },
  { id: "4", title: "Full Syllabus Mock Test", type: "Mock Test", subject: "All", questions: 50, status: "Archived" },
];


export default function ManageQuizzesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Manage Quizzes</h1>
        <Link href="/quizzes/upload" passHref>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Quiz
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Quiz List</CardTitle>
          <CardDescription>View, edit, and manage all your quizzes.</CardDescription>
          <div className="flex flex-col md:flex-row items-center gap-2 pt-4">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search quizzes..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <Button variant="outline" size="sm" className="ml-auto flex h-8 gap-1">
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Filter</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockQuizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell>{quiz.type}</TableCell>
                  <TableCell>{quiz.subject}</TableCell>
                  <TableCell className="text-center">{quiz.questions}</TableCell>
                  <TableCell>
                     <span className={`px-2 py-1 text-xs rounded-full ${
                        quiz.status === "Published" ? "bg-green-100 text-green-700" : 
                        quiz.status === "Draft" ? "bg-yellow-100 text-yellow-700" : 
                        "bg-gray-100 text-gray-700"
                      }`}>{quiz.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="mr-2">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
