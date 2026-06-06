"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  FileText,
  ShoppingBag,
  MapPin,
  MessageSquare,
  Mail,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth.actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/blogs", label: "Blogs", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/destinations", label: "Destinations", icon: MapPin },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
];

export function AdminSidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activePath = mounted ? pathname : "";

  const isActive = (href: string, exact?: boolean) =>
    exact ? activePath === href : activePath === href || activePath.startsWith(`${href}/`);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href, item.exact)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b p-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-heading font-extrabold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-gradient">TrendTales</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card p-4 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Link href="/admin" className="mb-6 hidden items-center gap-2 font-heading text-lg font-extrabold lg:flex">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-gradient">TrendTales</span>
        </Link>

        {nav}

        <div className="mt-auto space-y-2 border-t pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <div className="px-3 text-xs text-muted-foreground">
            {userName && <p className="truncate font-medium text-foreground">{userName}</p>}
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
