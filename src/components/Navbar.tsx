"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, User, PenSquare, LogOut, Menu, X, Layers, Cpu, ShieldAlert, Terminal } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ThemeToggle from "./ThemeToggle";

export type NavbarTopic = "saas" | "ai" | "devops" | "design";

const topicLinks = [
  { label: "SaaS & Architecture", href: "/blog?topic=saas", icon: <Layers size={14} className="text-accent" /> },
  { label: "AI & Automation", href: "/blog?topic=ai", icon: <Cpu size={14} className="text-emerald-400" /> },
  { label: "DevOps & Infosec", href: "/blog?topic=devops", icon: <ShieldAlert size={14} className="text-rose-400" /> },
  { label: "Design Systems", href: "/blog?topic=design", icon: <Terminal size={14} className="text-blue-400" /> },
];

function TopicDropdownMenu({ label, menuId }: { label: string; menuId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div 
      ref={menuRef}
      className="relative group/menu py-2"
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1 transition-colors hover:text-accent cursor-pointer text-sm font-semibold"
      >
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 transition-transform group-hover/menu:rotate-180 opacity-60" aria-hidden="true" />
      </button>
      
      <div
        id={menuId}
        role="menu"
        className={`absolute left-0 top-full z-50 mt-1 grid w-64 gap-1 rounded-2xl border border-text-muted/15 bg-surface p-2 text-sm font-medium text-foreground shadow-xl 
        transition-all duration-150 ease-out
        ${isOpen ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-1 md:group-hover/menu:visible md:group-hover/menu:opacity-100 md:group-hover/menu:translate-y-0"}`}
      >
        {topicLinks.map((topic) => (
          <Link
            key={topic.href}
            href={topic.href}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/10 hover:text-accent"
          >
            {topic.icon}
            <span>{topic.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const supabase = createClient();

    async function loadUserProfile(userId: string | null, email: string | null) {
      if (!userId) {
        if (isCurrent) {
          setActiveUserId(null);
          setUnreadCount(0);
          setUserEmail(null);
          setUsername(null);
          setDisplayName(null);
          setAvatarUrl(null);
          setIsAdmin(false);
        }
        return;
      }
      
      if (isCurrent) {
        setActiveUserId(userId);
        setUserEmail(email);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, role")
        .eq("id", userId)
        .maybeSingle();

      if (isCurrent && profile) {
        setUsername(profile.username ?? null);
        setDisplayName(profile.display_name ?? null);
        setAvatarUrl(profile.avatar_url ?? null);
        setIsAdmin(profile.role === "admin");
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadUserProfile(data.user?.id ?? null, data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUserProfile(session?.user?.id ?? null, session?.user?.email ?? null);
    });

    return () => {
      isCurrent = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!activeUserId) return;

    let isCurrent = true;
    const supabase = createClient();

    async function refreshUnreadCount() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", activeUserId)
        .is("read_at", null);

      if (isCurrent) setUnreadCount(count ?? 0);
    }

    refreshUnreadCount();
    window.addEventListener("focus", refreshUnreadCount);
    window.addEventListener("starfish-notifications-updated", refreshUnreadCount);
    const intervalId = window.setInterval(refreshUnreadCount, 60_000);

    return () => {
      isCurrent = false;
      window.removeEventListener("focus", refreshUnreadCount);
      window.removeEventListener("starfish-notifications-updated", refreshUnreadCount);
      window.clearInterval(intervalId);
    };
  }, [activeUserId]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.refresh();
    router.push("/");
  }

  const accountLabel = displayName || username || userEmail?.split("@")[0] || "Account";
  const accountInitial = accountLabel.charAt(0).toUpperCase();
  return (
    <header className="sticky top-0 z-50 border-b border-text-muted/10 bg-background/75 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        
        {/* Left Section: Brand & Desktop Taxonomy Links */}
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <Link href="/" className="text-2xl font-black tracking-tight text-foreground transition-colors hover:text-accent md:text-3xl shrink-0">
            <span>Star</span><span className="text-accent">fish</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-muted">
            <TopicDropdownMenu label="Knowledge Base" menuId="desktop-topic-menu" />
            <Link href="/blog" className="transition-colors hover:text-accent">All Articles</Link>
            {isAdmin && (
              <Link href="/admin" className="transition-colors hover:text-accent text-accent">Admin Portal</Link>
            )}
          </nav>
        </div>

        {/* Right Section: Interactive Profile Action Group */}
        <div className="flex items-center gap-3 text-sm font-semibold pl-2 shrink-0">
          {userEmail && (
            <Link
              href="/notifications"
              aria-label={`Notifications, ${unreadCount} unread`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:text-accent"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-slate-950 animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User Profile Workspace Context Dropdown */}
          <div className="hidden md:flex items-center gap-3">
            {userEmail ? (
              <div className="relative group/user-menu py-2">
                <button type="button" className="inline-flex max-w-28 items-center gap-2 truncate transition-colors hover:text-accent cursor-pointer text-text-muted">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-text-muted/20 bg-surface">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-accent">{accountInitial}</span>
                    )}
                  </span>
                  <span className="truncate">{username || "Account"}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 transition-transform group-hover/user-menu:rotate-180" aria-hidden="true" />
                </button>
                <div role="menu" className="absolute right-0 top-full z-50 mt-1 flex w-56 flex-col gap-1 rounded-2xl border border-text-muted/15 bg-surface p-2 text-sm font-medium text-foreground shadow-xl invisible opacity-0 translate-y-1 group-hover/user-menu:visible group-hover/user-menu:opacity-100 group-hover/user-menu:translate-y-0 transition-all duration-150 ease-out">
                  <Link href="/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-accent/10 hover:text-accent">
                    <User className="h-4 w-4 shrink-0 opacity-70" />
                    <span>My Workspace</span>
                  </Link>
                  <Link href="/write" className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-accent/10 hover:text-accent">
                    <PenSquare className="h-4 w-4 opacity-70" />
                    <span>Write an article</span>
                  </Link>
                  <hr className="my-1 border-text-muted/10" />
                  <button type="button" onClick={handleSignOut} className="flex items-center gap-2.5 w-full text-left rounded-xl px-3 py-2 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer">
                    <LogOut className="h-4 w-4 opacity-70" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="transition-colors hover:text-accent text-text-muted">Sign in</Link>
            )}
          </div>

          <ThemeToggle className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-text-muted/20 bg-surface text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/80 hover:text-accent cursor-pointer" />

          {/* Mobile Navigation Menu Hamburger Trigger */}
          <button
            type="button"
            aria-label="Toggle mobile overlay drawer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden transition-colors hover:text-accent cursor-pointer text-foreground"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Full Width Dropdrawer Overlay Container for Mobile Viewports */}
      {mobileMenuOpen && (
        <div className="w-full bg-surface border-b border-text-muted/15 shadow-xl md:hidden animate-search-placeholder">
          <nav className="flex flex-col p-4 gap-2 font-semibold text-foreground">
            <div className="border-b border-text-muted/10 pb-2">
              <div className="flex flex-col gap-2 py-2">
                <span className="text-xs uppercase tracking-wider text-text-muted font-bold px-1">Categories Matrix</span>
                {topicLinks.map((topic) => (
                  <Link key={topic.href} href={topic.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-accent/10">
                    {topic.icon}
                    <span>{topic.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-text-muted/10 text-sm hover:text-accent transition-colors">
              All Articles Index
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="py-3 border-b border-text-muted/10 text-sm text-accent transition-colors">
                Admin Secure Dashboard
              </Link>
            )}

            {userEmail ? (
              <div className="flex flex-col gap-2 pt-2">
                <div className="text-xs text-text-muted uppercase tracking-wider px-1 font-bold">Creator Suite</div>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-sm">
                  <User size={16} />
                  <span>My Workspace</span>
                </Link>
                <Link href="/write" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-sm"><PenSquare size={16} /><span>Deploy Publication</span></Link>
                <button type="button" onClick={handleSignOut} className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-rose-500/10 text-rose-400 text-sm text-left w-full mt-1"><LogOut size={16} /><span>Sign Out Baseline</span></button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mt-2 text-center rounded-xl bg-accent py-3 text-sm font-bold text-slate-950 transition-colors">Sign In to Dashboard</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

