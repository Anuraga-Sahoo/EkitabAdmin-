import { OverviewCard } from '@/components/dashboard/OverviewCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenCheck, FileText, ListOrdered, Users } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard title="Total Quizzes" value="125" icon={BookOpenCheck} description="+5 from last month" />
        <OverviewCard title="Practice Tests" value="60" icon={FileText} description="Active" />
        <OverviewCard title="Mock Tests" value="40" icon={ListOrdered} description="Scheduled" />
        <OverviewCard title="Previous Year Tests" value="25" icon={Users} description="Archived" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
            <CardDescription>Overview of recent quiz uploads and updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors">
                <span className="font-medium">Physics Chapter 3 Test Uploaded</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors">
                <span className="font-medium">Mock Test #5 Scheduled</span>
                <span className="text-sm text-muted-foreground">1 day ago</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors">
                <span className="font-medium">Chemistry PYQ 2022 Added</span>
                <span className="text-sm text-muted-foreground">3 days ago</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Content Distribution</CardTitle>
            <CardDescription>Breakdown of quizzes by subject.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            {/* Placeholder for a chart. For now, using a placeholder image. */}
            <Image 
              src="https://placehold.co/300x200.png" 
              alt="Content Distribution Chart Placeholder" 
              width={300} 
              height={200}
              data-ai-hint="pie chart" 
              className="rounded-md"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
