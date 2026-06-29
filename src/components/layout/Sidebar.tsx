import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { NAV_SECTIONS } from './nav';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const role = user?.role ?? 'employee';

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-display text-[15px] font-bold leading-none text-white">Talent Sphere</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Enterprise Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-white/5 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 no-scrollbar">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((i) => i.roles.includes(role));
            if (!items.length) return null;
            return (
              <div key={section.title}>
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg bg-sidebar-active/20 ring-1 ring-inset ring-sidebar-active/30"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            />
                          )}
                          <item.icon className="relative z-10 h-[18px] w-[18px]" />
                          <span className="relative z-10">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-medium text-white">Need help?</p>
            <p className="mt-0.5 text-[11px] text-sidebar-foreground/60">
              Visit the workflow guide to learn the approval process.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
