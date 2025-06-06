import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserCircle, KeyRound, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><UserCircle className="w-5 h-5" /> Profile Settings</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="Admin User" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="admin@quizhub.com" />
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Update Profile</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><KeyRound className="w-5 h-5" /> Account Settings</CardTitle>
            <CardDescription>Manage your account preferences and security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 font-body">Change Password</h3>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button variant="outline" className="mt-4">Change Password</Button>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2 font-body flex items-center gap-2"><Bell className="w-5 h-5" /> Notification Preferences</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications" className="font-normal">Email Notifications for Quiz Submissions</Label>
                  <Input type="checkbox" id="emailNotifications" className="h-5 w-5 accent-primary" defaultChecked/>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemUpdates" className="font-normal">Receive System Update Notifications</Label>
                  <Input type="checkbox" id="systemUpdates" className="h-5 w-5 accent-primary" defaultChecked/>
                </div>
              </div>
               <Button variant="outline" className="mt-4">Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
