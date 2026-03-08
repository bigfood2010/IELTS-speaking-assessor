import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { History, LayoutDashboard, LogOut, Mic, Settings, Trophy } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Practice', path: '/app/speaking', icon: <Mic size={20} /> },
    { name: 'History', path: '/app/history', icon: <History size={20} /> },
    { name: 'Settings', path: '/app/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-zinc-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="border-b border-zinc-100 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-heritage-forest shadow-sm ring-1 ring-white/10">
              <Trophy size={20} className="text-[#FEFFD3]" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">IELTS Assessor</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Speaking Studio</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-heritage-sage/20 text-heritage-forest shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 transition-colors ${isActive ? 'text-heritage-forest' : 'group-hover:text-zinc-900'}`}>{item.icon}</span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-zinc-100 p-4">
          {user && (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
              <div className="flex items-center gap-3">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border border-zinc-200 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-zinc-200 bg-white flex items-center justify-center uppercase font-medium text-zinc-500">
                    {user.email?.[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="px-6 py-8 pb-24 lg:ml-64 lg:px-12">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-zinc-200 bg-white p-2 lg:hidden safe-area-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-lg p-2 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`
            }
          >
            {item.icon}
            <span className="mt-1">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
