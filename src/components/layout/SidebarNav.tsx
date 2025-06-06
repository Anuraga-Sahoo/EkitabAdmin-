
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UploadCloud, ListChecks, Settings, Users, FilePlus2 } from 'lucide-react'; // Added Users, FilePlus2 icons
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quizzes/upload', label: 'Upload Quiz', icon: UploadCloud },
  { href: '/quizzes', label: 'Manage Quizzes', icon: ListChecks },
  { href: '/exams/create', label: 'Create Exam', icon: FilePlus2 }, // Added Create Exam link
  { href: '/users', label: 'Users', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              className="w-full"
              tooltip={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
