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
} from "lucide-react";

import {
    getNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
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

    const notificationsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
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
        <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-8">
            {/* Left Section */}
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                    {currentRole === "Admin" ? "Admin Dashboard" : "Recruiter Dashboard"}
                </h1>
                <p className="text-sm text-slate-400">
                    {currentRole === "Admin"
                        ? "Manage platform operations and settings"
                        : "Manage recruitment activities"}
                </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block" ref={searchRef}>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearchResults(e.target.value.trim().length > 0);
                            }}
                            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                            onKeyDown={handleSearchKeyDown}
                            className="bg-transparent text-sm text-white outline-none placeholder:text-slate-500 w-40"
                        />
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 min-w-[280px]">
                            {filteredSearchItems.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    No results found for &quot;{searchQuery}&quot;
                                </div>
                            ) : (
                                <div className="py-1">
                                    <div className="px-3 py-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                        Navigate to
                                    </div>
                                    {filteredSearchItems.map((result) => (
                                        <button
                                            key={result.href}
                                            onClick={() => handleSearchNavigate(result.href)}
                                            className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-slate-900 transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all">
                                                {result.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{result.label}</p>
                                                <p className="text-[11px] text-slate-600">{result.href}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-white transition hover:bg-slate-800"
                >
                    {isDark ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-white transition hover:bg-slate-800"
                    >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 z-50 w-96 rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
                            <div className="border-b border-slate-800 p-4">
                                <h3 className="font-semibold text-white">Notifications</h3>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-slate-400">No notifications</div>
                                ) : (
                                    notifications.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={async () => {
                                                await markNotificationAsRead(item.id);
                                                fetchNotifications();
                                            }}
                                            className={`cursor-pointer border-b border-slate-800 p-4 hover:bg-slate-900 ${
                                                !item.is_read ? "bg-slate-900/40" : ""
                                            }`}
                                        >
                                            <p className="font-medium text-white">{item.title}</p>
                                            <p className="mt-1 text-sm text-slate-400">{item.message}</p>
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
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 transition hover:bg-slate-800"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                            {user?.email?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="hidden text-left md:block">
                            <p className="text-sm font-medium text-white">
                                {user?.email?.split("@")[0] || "User"}
                            </p>
                            <p className="text-xs text-slate-400">{currentRole}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden z-50">
                            <div className="p-4 border-b border-white/10">
                                <p className="text-sm font-medium text-white">{user?.email}</p>
                                <p className="text-xs text-white/60">Account</p>
                            </div>

                            {hasAdminPortalAccess() && hasRecruiterPortalAccess() && (
                                <div className="px-3 py-2 border-b border-white/10">
                                    <p className="text-xs text-white/50 mb-2">Switch Role</p>
                                    <button
                                        onClick={() => {
                                            localStorage.setItem("portal", "admin");
                                            setCurrentRole("Admin");
                                            setShowProfileMenu(false);
                                            router.push("/admin/dashboard");
                                        }}
                                        className="w-full text-left px-2 py-2 rounded hover:bg-white/10 text-sm text-white"
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
                                        className="w-full text-left px-2 py-2 rounded hover:bg-white/10 text-sm text-white"
                                    >
                                        Recruiter
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
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm text-white/70 hover:text-white"
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
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm text-white/70 hover:text-white"
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
        </header>
    );
}