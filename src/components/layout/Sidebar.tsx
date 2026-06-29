import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, LifeBuoy } from 'lucide-react';
import { NAV_SECTIONS } from './nav';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const role = user?.role ?? 'employee';

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-gray-900/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-display text-[15px] font-bold leading-none text-white">Talent Sphere</p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/50">Enterprise Suite</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5 no-scrollbar">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((i) => i.roles.includes(role));
            if (!items.length) return null;
            return (
              <div key={section.title}>
                <p className="px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/35">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150',
                          isActive
                            ? 'text-white'
                            : 'text-sidebar-foreground/75 hover:bg-sidebar-hover hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-xl bg-sidebar-active shadow-[0_4px_12px_-2px_rgb(37_99_235_/_0.45)]"
                              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                            />
                          )}
                          <item.icon
                            className={cn(
                              'relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
                              !isActive && 'group-hover:-translate-y-px'
                            )}
                          />
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

        {/* Footer helper */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-start gap-3 rounded-xl bg-sidebar-hover/70 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <LifeBuoy className="h-4 w-4 text-sidebar-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Need help?</p>
              <p className="mt-0.5 text-[11px] leading-snug text-sidebar-foreground/55">
                Read the workflow guide to learn the approval process.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
