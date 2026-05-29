"use client";

import { usePathname } from "next/navigation";
import { BottomNavProfile } from "@/components/HeaderProfile";
import { Bookmark, Compass, Sparkles, Users } from "@/components/icons";
import { Link } from "@/components/Link";

const NAV = [
  { href: "/", label: "My list", icon: Bookmark },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/wizard", label: "Wizard", icon: Sparkles },
  { href: "/discover", label: "People", icon: Users },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 text-[11px] font-medium no-underline transition-colors ${
                active ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <BottomNavProfile />
      </div>
    </nav>
  );
}
