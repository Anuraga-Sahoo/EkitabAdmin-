
'use client';

import { useState, useEffect } from 'react';
import type { Quiz } from '@/lib/types';
import { OverviewCard } from '@/components/dashboard/OverviewCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenCheck, FileText, ListOrdered, Users, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/quizzes');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.statusText}`);
        }
        const data: Quiz[] = await response.json();
        setQuizzes(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const totalQuizzes = quizzes.length;
  const practiceTestsCount = quizzes.filter(q => q.testType === 'Practice Test').length;
  const mockTestsCount = quizzes.filter(q => q.testType === 'Mock').length;
  const pyqTestsCount = quizzes.filter(q => q.testType === 'Previous Year').length;

  const recentActivities = quizzes
    .sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
    })
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto my-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive font-headline">Error Loading Dashboard</CardTitle>
          <CardDescription>There was a problem fetching the data for the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground bg-destructive/10 p-4 rounded-md">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard title="Total Quizzes" value={totalQuizzes} icon={BookOpenCheck} description="Currently in system" />
        <OverviewCard title="Practice Tests" value={practiceTestsCount} icon={FileText} description="Available for practice" />
        <OverviewCard title="Mock Tests" value={mockTestsCount} icon={ListOrdered} description="Available for assessment" />
        <OverviewCard title="Previous Year Tests" value={pyqTestsCount} icon={Users} description="Archived tests" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
            <CardDescription>Overview of the latest quiz updates.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <ul className="space-y-3">
                {recentActivities.map(activity => (
                  <li key={activity._id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors">
                    <span className="font-medium">{activity.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.updatedAt || activity.createdAt || Date.now()), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No recent quiz activity.</p>
            )}
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
