"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { X, Check } from "lucide-react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get("/admin/notifications");
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const dismissNotification = async (id: number) => {
        try {
            await api.delete(`/admin/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (error) {
            console.error("Failed to dismiss notification:", error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.put(`/admin/notifications/${id}/read`);
            setNotifications((prev) => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Notifications</h2>
                <p className="text-slate-400">System and user activity notifications</p>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-950 border border-slate-800 rounded-2xl">
                    No new notifications
                </div>
            ) : (
                notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`group relative rounded-2xl border bg-slate-950 p-5 pr-20 transition-all ${
                            notification.is_read ? "border-slate-800 opacity-70" : "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        }`}
                    >
                        {!notification.is_read && (
                            <div className="absolute top-6 left-2 h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        
                        <div className="pl-4">
                            <h3 className={`font-semibold ${notification.is_read ? 'text-slate-300' : 'text-white'}`}>
                                {notification.title}
                            </h3>
                            <p className="mt-2 text-slate-400 text-sm">{notification.message}</p>
                            <span className="text-xs text-slate-500 mt-3 block">
                                {new Date(notification.created_at).toLocaleString()}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-5 right-5 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {!notification.is_read && (
                                <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="rounded-full bg-slate-900 p-2 text-slate-400 hover:bg-blue-500/20 hover:text-blue-400"
                                    title="Mark as read"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={() => dismissNotification(notification.id)}
                                className="rounded-full bg-slate-900 p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                                title="Dismiss notification"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}