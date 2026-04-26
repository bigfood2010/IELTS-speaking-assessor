import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import History from 'lucide-react/dist/esm/icons/history';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Trophy from 'lucide-react/dist/esm/icons/trophy';


import { useAuth } from '@/store/AuthContext';
import { usePractice } from '@/store/PracticeContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  hasBadge?: boolean;
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { hasActiveResults } = usePractice();
  
  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} /> },
    { 
      name: 'Practice', 
      path: '/app/speaking', 
      icon: <Mic size={20} />,
      hasBadge: hasActiveResults
    },
    { name: 'History', path: '/app/history', icon: <History size={20} /> },
    { name: 'Settings', path: '/app/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-studio-paper text-studio-ink font-sans">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-studio-silver bg-white lg:flex shadow-sm">
        <div className="border-b border-studio-silver px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vibrant-emerald shadow-lg shadow-vibrant-emerald/20 ring-1 ring-white/20">
              <Trophy size={20} className="text-vibrant-gold" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-studio-ink">IELTS Assessor</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-vibrant-emerald">Speaking Studio</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-vibrant-rose/8 text-vibrant-rose shadow-[0_4px_12px_rgba(242,96,118,0.12)]'
                    : 'text-zinc-500 hover:bg-studio-paper hover:text-studio-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`relative shrink-0 transition-colors ${isActive ? 'text-vibrant-rose' : 'group-hover:text-studio-ink'}`}>
                    {item.icon}
{item.hasBadge && (
                      <span className="absolute -right-1 -top-1 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vibrant-emerald opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-vibrant-emerald ring-2 ring-white"></span>
                      </span>
                    )}
                  </span>
                  <span className="tracking-tight">{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute left-0 w-1 h-5 bg-vibrant-rose rounded-r-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-studio-silver px-5 py-4">
          {user && (
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-vibrant-emerald flex items-center justify-center uppercase font-bold text-white text-sm">
                  {user.email?.[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-studio-ink">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <button
                  onClick={signOut}
                  className="text-xs text-zinc-400 hover:text-vibrant-rose transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="px-6 py-10 pb-24 lg:ml-64 lg:px-14">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-studio-silver bg-white/80 p-2 lg:hidden backdrop-blur-xl safe-area-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center rounded-xl p-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                isActive ? 'text-vibrant-rose scale-110' : 'text-zinc-400 opacity-60'
              }`
            }
          >
            <div className="relative">
              {item.icon}
              {item.hasBadge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vibrant-emerald opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-vibrant-emerald ring-2 ring-white"></span>
                </span>
              )}
            </div>
            <span className="mt-1">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
