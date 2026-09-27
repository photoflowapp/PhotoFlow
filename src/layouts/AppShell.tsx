import React, { useState } from 'react';
import {
  LayoutGrid,
  Kanban,
  Calendar,
  CheckSquare,
  CreditCard,
  Search,
  Settings,
  Plus,
  LogOut,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import { AppPage } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface AppShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Home', icon: LayoutGrid },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'payments', label: 'Billing', icon: CreditCard },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const currentPage = usePhotoFlowStore((s) => s.currentPage);
  const setCurrentPage = usePhotoFlowStore((s) => s.setCurrentPage);
  const openNewProjectWizard = usePhotoFlowStore((s) => s.openNewProjectWizard);
  const setSearchOpen = usePhotoFlowStore((s) => s.setSearchOpen);
  const setSettingsOpen = usePhotoFlowStore((s) => s.setSettingsOpen);
  const user = usePhotoFlowStore((s) => s.user);
  const settings = usePhotoFlowStore((s) => s.settings);
  const lockVault = usePhotoFlowStore((s) => s.lockVault);
  const signOut = usePhotoFlowStore((s) => s.signOut);

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col md:flex-row">
      {/* Desktop Sidebar — clean navigation */}
      <aside className="hidden md:flex md:w-52 md:flex-col md:fixed md:inset-y-0 bg-[#fafafa] border-r border-neutral-200 select-none z-30">
        <div className="h-14 px-5 flex items-center">
          <span className="text-sm font-semibold tracking-tight text-black truncate">
            {settings.studioName || 'PhotoFlow'}
          </span>
        </div>

        <nav className="flex-1 px-2.5 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                  active
                    ? 'bg-neutral-200/75 text-black font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-52 flex flex-col min-h-screen">
        {/* Top Bar:
            - Left: Studio name (mobile) + Search button
            - Right (Desktop): Sync/PWA + "New project" button + Account dropdown
            - Right (Mobile): Hamburger menu containing "New project" button + Account/Settings/Lock/Sign out
        */}
        <header className="sticky top-0 z-20 h-13 bg-white/95 backdrop-blur-sm border-b border-neutral-100 px-4 md:px-8 flex items-center justify-between gap-3">
          {/* Left: Name + Search */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="md:hidden text-sm font-semibold text-black truncate">
              {settings.studioName || 'PhotoFlow'}
            </span>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="hidden md:inline text-[10px] text-neutral-400 font-mono">⌘K</kbd>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <SyncStatusBadge />
              <PWAInstallButton />

              <button
                type="button"
                onClick={openNewProjectWizard}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New project</span>
              </button>
            </div>

            {/* Desktop Account Button & Mobile Hamburger Button */}
            <div className="relative">
              {/* Desktop trigger */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="hidden md:inline-flex items-center h-8 px-2.5 rounded-md text-xs text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer truncate max-w-[140px]"
              >
                {user?.email?.split('@')[0] || 'Account'}
              </button>

              {/* Mobile Hamburger trigger */}
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-neutral-200 shadow-2xl py-2 z-50">
                    {/* Mobile New Project Action inside Hamburger */}
                    <div className="px-3 pb-2 mb-1 border-b border-neutral-100 md:hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openNewProjectWizard();
                        }}
                        className="w-full h-9 px-3 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New project</span>
                      </button>
                    </div>

                    <div className="px-3 py-2 border-b border-neutral-100">
                      <p className="text-xs font-medium text-black truncate">{user?.email}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-neutral-400">Encrypted · Supabase</p>
                        <div className="md:hidden flex items-center gap-1.5">
                          <SyncStatusBadge />
                        </div>
                      </div>
                    </div>

                    <div className="md:hidden px-3 py-1.5 border-b border-neutral-100 empty:hidden">
                      <PWAInstallButton />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-neutral-400" />
                      <span>Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        lockVault();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-black cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-neutral-400" />
                      <span>Lock workspace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-neutral-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 px-4 py-4 md:px-10 md:py-7 pb-28 md:pb-12 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-neutral-200 flex items-center justify-around pt-2 pb-[30px] px-1"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentPage(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors cursor-pointer ${
                active ? 'text-black font-medium' : 'text-neutral-400 hover:text-black'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
