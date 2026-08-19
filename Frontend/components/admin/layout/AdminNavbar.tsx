"use client";

import {
 Bell,
 Search,
 Moon,
 Sun,
 ChevronDown,
 Settings,
 LogOut,
 User,
 LayoutGrid,
 Users,
 ShieldCheck,
 Lock,
 BarChart3,
 FileText,
 Mail,
 Bot,
} from "lucide-react";

import { motion } from "framer-motion";
import {
 getNotifications,
 getUnreadNotifications,
 markNotificationAsRead,
 getAISettings,
} from "@/services/adminService";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth";

import { hasAdminPortalAccess, hasRecruiterPortalAccess, hasPermission } from "@/utils/permissions";
import { applyTheme } from "@/utils/theme";

interface SearchItem {
 label: string;
 href: string;
 icon: React.ReactNode;
 keywords: string[];
}

export default function AdminNavbar() {
 const [isDark, setIsDark] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [showSearchResults, setShowSearchResults] = useState(false);
 const searchRef = useRef<HTMLDivElement>(null);

 // Searchable items for admin portal
 const searchItems: SearchItem[] = [
 { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutGrid className="w-4 h-4" />, keywords: ["dashboard", "home", "overview", "admin"] },
 { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" />, keywords: ["users", "people", "accounts", "manage users", "team"] },
 { label: "Roles", href: "/admin/roles", icon: <ShieldCheck className="w-4 h-4" />, keywords: ["roles", "permissions", "access", "rbac", "role management"] },
 { label: "Security", href: "/admin/security", icon: <Lock className="w-4 h-4" />, keywords: ["security", "password", "authentication", "2fa", "login"] },
 { label: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="w-4 h-4" />, keywords: ["analytics", "reports", "charts", "data", "metrics", "statistics"] },
 { label: "Audit Logs", href: "/admin/audit-logs", icon: <FileText className="w-4 h-4" />, keywords: ["audit", "logs", "activity", "history", "trail"] },
 { label: "Mailbox", href: "/admin/mailbox", icon: <Mail className="w-4 h-4" />, keywords: ["mailbox", "email", "inbox", "messages", "communication"] },
 { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" />, keywords: ["settings", "preferences", "configuration", "platform", "ai settings"] },
 ];

 const filteredSearchItems = searchQuery.trim()
 ? searchItems.filter(item => {
 const q = searchQuery.toLowerCase();
 return item.label.toLowerCase().includes(q) ||
 item.keywords.some(kw => kw.includes(q));
 })
 : [];

 useEffect(() => {
 setIsDark(document.documentElement.classList.contains("dark"));

 const handleThemeChange = () => {
 setIsDark(document.documentElement.classList.contains("dark"));
 };

 window.addEventListener("theme-changed", handleThemeChange);
 return () => window.removeEventListener("theme-changed", handleThemeChange);
 }, []);

 // Close search results on click outside
 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
 setShowSearchResults(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const toggleTheme = () => {
 const nextTheme = isDark ? "light" : "dark";
 localStorage.setItem("theme", nextTheme);
 applyTheme(nextTheme);
 };
 const [user, setUser] = useState<any>(null);
 const [showProfileMenu, setShowProfileMenu] = useState(false);
 const [currentRole, setCurrentRole] = useState("Recruiter");
 const [showNotifications, setShowNotifications] = useState(false);
 const [notifications, setNotifications] = useState<any[]>([]);
 const [unreadCount, setUnreadCount] = useState(0);
 const [activeAIProvider, setActiveAIProvider] = useState<string | null>(null);
 const canManageAI = hasPermission("ai_settings.manage", true);

 const notificationsRef = useRef<HTMLDivElement>(null);
 const profileRef = useRef<HTMLDivElement>(null);
 const router = useRouter();

 useEffect(() => {
 fetchNotifications();

 const fetchAI = async () => {
   try {
     const settings = await getAISettings();
     if (settings?.active_provider) {
       setActiveAIProvider(settings.active_provider);
     }
   } catch { /* silent */ }
 };
 fetchAI();

 // Update badge immediately when user saves from the AI settings page
 const handleAIChange = (e: Event) => {
   const detail = (e as CustomEvent).detail;
   if (detail?.provider) setActiveAIProvider(detail.provider);
 };
 window.addEventListener('ai-provider-changed', handleAIChange);

 return () => {
   window.removeEventListener('ai-provider-changed', handleAIChange);
 };
 }, []);

 const fetchNotifications = async () => {
 try {
 const count = await getUnreadNotifications();
 setUnreadCount(count.count);

 const data = await getNotifications();
 setNotifications(data);
 } catch (error) {
 console.error(error);
 }
 };

 useEffect(() => {
 const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
 setUser(storedUser);

 const portal = localStorage.getItem("portal");
 if (portal === "admin") {
 setCurrentRole("Admin");
 } else {
 setCurrentRole("Recruiter");
 }
 }, []);

 // Close dropdowns when clicking outside
 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (
 notificationsRef.current &&
 !notificationsRef.current.contains(event.target as Node)
 ) {
 setShowNotifications(false);
 }
 if (
 profileRef.current &&
 !profileRef.current.contains(event.target as Node)
 ) {
 setShowProfileMenu(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const handleSearchNavigate = (href: string) => {
 setSearchQuery("");
 setShowSearchResults(false);
 router.push(href);
 };

 const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter" && filteredSearchItems.length > 0) {
 handleSearchNavigate(filteredSearchItems[0].href);
 }
 if (e.key === "Escape") {
 setShowSearchResults(false);
 setSearchQuery("");
 }
 };

 return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-0 z-50 flex h-[72px] items-center border-b border-border bg-surface px-6"
    >
      <div className="flex w-full items-center justify-between gap-4">
        {/* Search on the Left */}
        <div className="relative max-w-sm flex-1 transition-all duration-base ease-standard focus-within:max-w-md" ref={searchRef}>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search candidates, reports..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
              onKeyDown={handleSearchKeyDown}
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-100/90 pl-4 pr-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-500 hover:bg-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700/60 dark:bg-[#222B40] dark:text-white dark:placeholder:text-slate-400 dark:hover:bg-[#28334C] dark:focus:bg-[#1C2436] dark:focus:border-primary dark:focus:ring-primary/30"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400 transition-colors" />
          </div>

 {/* Search Results Dropdown */}
 {showSearchResults && (
 <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-background/95 shadow-2xl overflow-hidden z-50 min-w-[280px]">
 {filteredSearchItems.length === 0 ? (
 <div className="p-4 text-center text-muted text-sm">
 No results found for &quot;{searchQuery}&quot;
 </div>
 ) : (
 <div className="py-1">
 <div className="px-3 py-2 text-[10px] text-muted uppercase tracking-widest font-semibold">
 Navigate to
 </div>
 {filteredSearchItems.map((result) => (
 <button
 key={result.href}
 onClick={() => handleSearchNavigate(result.href)}
 className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-surface transition-colors group"
 >
 <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all">
 {result.icon}
 </div>
 <div>
 <p className="text-sm font-medium text-secondary group-hover:text-text-primary transition-colors">{result.label}</p>
 <p className="text-[11px] text-slate-600">{result.href}</p>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 )}
 </div>

        {/* Right Section: Controls Grouped Together */}
        <div className="flex items-center gap-3">

          {/* AI Agent Badge */}
          {activeAIProvider && (
          canManageAI ? (
          <button
          onClick={() => router.push('/admin/ai')}
          title="Click to change AI provider"
          className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 transition-all hover:bg-violet-500/20 hover:border-violet-400/50 hover:scale-[1.02] active:scale-95"
          >
          <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          <Bot className="w-3.5 h-3.5" />
          AI Agent: {activeAIProvider}
          </button>
          ) : (
          <div
          title="Active AI Agent"
          className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400"
          >
          <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          <Bot className="w-3.5 h-3.5" />
          AI Agent: {activeAIProvider}
          </div>
          )
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-primary transition-all duration-base ease-standard focus-ring hover:bg-surface-hover hover:scale-[1.02] active:scale-95"
          >
            <div className="relative flex h-4 w-4 items-center justify-center">
              <Sun className={`absolute h-4 w-4 transition-all duration-base ease-standard ${isDark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
              <Moon className={`absolute h-4 w-4 transition-all duration-base ease-standard ${isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
            </div>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-primary transition hover:bg-secondary-surface"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 z-50 w-96 rounded-xl border border-border bg-background shadow-xl">
                <div className="border-b border-border p-4">
                  <h3 className="font-semibold text-text-primary">Notifications</h3>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-muted">No notifications</div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={async () => {
                          await markNotificationAsRead(item.id);
                          fetchNotifications();
                        }}
                        className={`cursor-pointer border-b border-border p-4 hover:bg-surface ${
                          !item.is_read ? "bg-surface/40" : ""
                        }`}
                      >
                        <p className="font-medium text-text-primary">{item.title}</p>
                        <p className="mt-1 text-sm text-muted">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 transition hover:bg-secondary-surface"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {user?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-text-primary">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted">{currentRole}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-medium text-text-primary">{user?.email}</p>
                  <p className="text-xs text-secondary">Account</p>
                </div>

                {hasAdminPortalAccess() && hasRecruiterPortalAccess() && (
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs text-text-secondary mb-2">Switch Role</p>
                    <button
                      onClick={() => {
                        localStorage.setItem("portal", "admin");
                        setCurrentRole("Admin");
                        setShowProfileMenu(false);
                        router.push("/admin/dashboard");
                      }}
                      className="w-full text-left px-2 py-2 rounded hover:bg-secondary-surface text-sm text-text-primary"
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("portal", "recruiter");
                        setCurrentRole("Recruiter");
                        setShowProfileMenu(false);
                        router.push("/dashboard");
                      }}
                      className="w-full text-left px-2 py-2 rounded hover:bg-secondary-surface text-sm text-text-primary"
                    >
                      Recruiter
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("portal", "hiring-manager");
                        setCurrentRole("Hiring Manager");
                        setShowProfileMenu(false);
                        router.push("/portal/hiring-manager?tab=candidates");
                      }}
                      className="w-full text-left px-2 py-2 rounded hover:bg-secondary-surface text-sm text-text-primary"
                    >
                      Hiring Manager
                    </button>
                  </div>
                )}

                <div className="p-2 space-y-2">
                  {hasPermission("settings.view", false) ? (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push("/admin/settings");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-surface transition-colors flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Platform Settings</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push("/settings");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary-surface transition-colors flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      AuthService.logout();
                      router.push("/login");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm text-red-300 hover:text-red-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
 );
}