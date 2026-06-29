import {
  LayoutDashboard, CheckSquare, FolderKanban, Users, Building2,
  BarChart3, Bell, Activity, UserCog, type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/lib/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
      { label: 'Tasks', to: '/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'employee'] },
      { label: 'Projects', to: '/projects', icon: FolderKanban, roles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Managers & Staff', to: '/people', icon: Users, roles: ['admin'] },
      { label: 'My Team', to: '/team', icon: Users, roles: ['manager'] },
      { label: 'Departments', to: '/departments', icon: Building2, roles: ['admin'] },
      { label: 'Analytics', to: '/analytics', icon: BarChart3, roles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'Activity',
    items: [
      { label: 'Activity Log', to: '/activity', icon: Activity, roles: ['admin', 'manager', 'employee'] },
      { label: 'Notifications', to: '/notifications', icon: Bell, roles: ['admin', 'manager', 'employee'] },
      { label: 'Profile', to: '/profile', icon: UserCog, roles: ['admin', 'manager', 'employee'] },
    ],
  },
];
