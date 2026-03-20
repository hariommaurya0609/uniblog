"use client";

import { Menu, Newspaper } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onMenuOpen?: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-950/90">
      {/* Mobile header: hamburger | centered logo | theme toggle */}
      <div className="relative flex items-center justify-between px-4 py-3.5 lg:hidden">
        <button
          onClick={onMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Open companies menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Centered logo */}
        <a
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20">
            <Newspaper className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Uni
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Blog
            </span>
          </span>
        </a>

        <ThemeToggle />
      </div>

      {/* Desktop header: logo left | theme toggle right */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3.5 lg:flex lg:px-8">
        <a
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Uni
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Blog
            </span>
          </span>
        </a>
        <nav className="flex items-center gap-3">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
