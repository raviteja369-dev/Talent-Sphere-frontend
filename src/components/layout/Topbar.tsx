import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Search, Sun, Moon, Bell, ChevronRight, LogOut, User as UserIcon, Settings, Check } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, useNotificationMutations } from '@/hooks/queries';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { cn, timeAgo } from '@/lib/utils';

const LABELS: Record<string, string> = {
  '': 'Dashboard', tasks: 'Tasks', projects: 'Projects', people: 'Managers & Staff',
  team: 'My Team', departments: 'Departments', analytics: 'Analytics',
  activity: 'Activity Log', notifications: 'Notifications', profile: 'Profile',
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');

  const { data: notifData } = useNotifications();
  const { markAllRead, markRead } = useNotificationMutations();

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.length ? segments : [''];

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/tasks?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 shadow-soft backdrop-blur-xl lg:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <nav className="hidden items-center gap-1.5 text-sm sm:flex">
        <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className={cn(i === crumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {LABELS[c] ?? c.charAt(0).toUpperCase() + c.slice(1)}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <form onSubmit={onSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="h-9 w-56 rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-sm focus-ring focus-visible:bg-surface"
          />
        </form>

        <button onClick={toggle} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <Dropdown
          width="w-80"
          trigger={
            <span className="relative flex rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Bell className="h-5 w-5" />
              {!!notifData?.unread && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {notifData.unread > 9 ? '9+' : notifData.unread}
                </span>
              )}
            </span>
          }
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold">Notifications</p>
            {!!notifData?.unread && (
              <button onClick={() => markAllRead.mutate()} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifData?.notifications.length ? (
              notifData.notifications.slice(0, 8).map((n) => (
                <button
                  key={n._id}
                  onClick={() => { markRead.mutate(n._id); if (n.task) navigate(`/tasks/${n.task._id}`); }}
                  className={cn('flex w-full gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-muted', !n.read && 'bg-accent/40')}
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                <Check className="mx-auto mb-2 h-6 w-6 opacity-40" />
                You're all caught up
              </div>
            )}
          </div>
          <Link to="/notifications" className="mt-1 block rounded-lg px-3 py-2 text-center text-xs font-medium text-primary hover:bg-muted">
            View all notifications
          </Link>
        </Dropdown>

        <Dropdown
          trigger={
            <span className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted">
              <Avatar name={user?.name} src={user?.avatar} size="sm" />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none text-foreground">{user?.name}</p>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">{user?.role}</p>
              </div>
            </span>
          }
        >
          {(close) => (
            <>
              <div className="border-b border-border px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="py-1">
                <DropdownItem onClick={() => { navigate('/profile'); close(); }}>
                  <UserIcon className="h-4 w-4" /> My Profile
                </DropdownItem>
                <DropdownItem onClick={() => { navigate('/profile'); close(); }}>
                  <Settings className="h-4 w-4" /> Settings
                </DropdownItem>
              </div>
              <div className="border-t border-border pt-1">
                <DropdownItem danger onClick={logout}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownItem>
              </div>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
