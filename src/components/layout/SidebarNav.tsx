
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UploadCloud, ListChecks, Settings, Users, FilePlus2, School, BookText, Bookmark, Megaphone, Image as ImageIcon } from 'lucide-react'; 
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quizzes/upload', label: 'Upload Quiz', icon: UploadCloud },
  { href: '/quizzes', label: 'Manage Quizzes', icon: ListChecks },
  { href: '/exams/create', label: 'Manage Exams', icon: FilePlus2 }, 
  { href: '/classes', label: 'Manage Classes', icon: School },
  { href: '/subjects', label: 'Manage Subjects', icon: BookText },
  { href: '/chapters', label: 'Manage Chapters', icon: Bookmark },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/banners', label: 'Banners', icon: ImageIcon },
  { href: '/notifications/create', label: 'Manage Notifications', icon: Megaphone },
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
