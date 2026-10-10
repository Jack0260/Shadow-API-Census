'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Radar,
  LayoutDashboard,
  Network,
  Table2,
  Users,
  ScrollText,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  Github,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCensus } from '@/lib/census-context';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/api-map', label: 'API Map', icon: Network },
  { href: '/shadow-apis', label: 'Shadow APIs', icon: Table2 },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/audit-log', label: 'Audit Log', icon: ScrollText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const { censusResult, isLoaded } = useCensus();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === 'dark';

  const shadowCount = censusResult.shadowApis;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card/50 backdrop-blur-sm fixed inset-y-0 left-0 z-40">
        <SidebarContent
          pathname={pathname}
          shadowCount={shadowCount}
          isDark={isDark}
          mounted={mounted}
          toggleTheme={toggleTheme}
        />
      </aside>

      {/* Sidebar — mobile */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-card lg:hidden animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Logo />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.href === '/shadow-apis' && shadowCount > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-xs font-bold text-destructive-foreground">
                      {shadowCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Census Active — {censusResult.totalCalls.toLocaleString()} calls analyzed</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {!isLoaded ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-3">
                <Radar className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Running census...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Radar className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-tight">Shadow API</span>
        <span className="text-xs text-muted-foreground">Census</span>
      </div>
    </Link>
  );
}

function SidebarContent({
  pathname,
  shadowCount,
  isDark,
  mounted,
  toggleTheme,
}: {
  pathname: string;
  shadowCount: number;
  isDark: boolean;
  mounted: boolean;
  toggleTheme: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center border-b border-border px-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.href === '/shadow-apis' && shadowCount > 0 && (
              <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-xs font-bold text-destructive-foreground">
                {shadowCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        <Link
          href="https://github.com"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          Documentation
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 text-muted-foreground"
        >
          {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {mounted && isDark ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
    </>
  );
}
