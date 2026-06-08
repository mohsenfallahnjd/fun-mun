"use client";

import { usePathname } from "next/navigation";
import { HeaderProfile } from "@/components/HeaderProfile";
import { Bookmark, Compass, Sparkles, Users } from "@/components/icons";
import { Link } from "@/components/Link";
import { NotificationsBell } from "@/components/NotificationsBell";

const NAV = [
  { href: "/", label: "My list", icon: Bookmark },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/wizard", label: "Wizard", icon: Sparkles },
  { href: "/discover", label: "People", icon: Users },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden min-w-0 flex-1 gap-1 overflow-x-auto rounded-2xl border border-border bg-surface/80 p-1 scrollbar-none sm:flex">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium no-underline transition-colors ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppHeader() {
  return (
    <div className="hidden items-center gap-2 sm:flex sm:gap-3">
      <SiteNav />
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
        <NotificationsBell />
        <HeaderProfile />
      </div>
    </div>
  );
}
