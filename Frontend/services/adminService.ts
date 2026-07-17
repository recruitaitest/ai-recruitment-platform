import api from "@/lib/api";

export const getUsers = async () => {
    const response = await api.get("/admin/users");
    return response.data;
};

export const createUser = async (userData: any) => {
    const response = await api.post("/admin/users", userData);
    return response.data;
};

export const deleteUser = async (
    userId: number
) => {
    const response = await api.delete(
        `/admin/users/${userId}`
    );

    return response.data;
};

export const updateUser = async (
    userId: number,
    userData: any
) => {
    const response = await api.put(
        `/admin/users/${userId}`,
        userData
    );

    return response.data;
};

export const getDashboardStats =
    async () => {
        const response =
            await api.get(
                "/admin/dashboard/stats"
            );

        return response.data;
    };

export const getRoles = async () => {
    const response = await api.get(
        "/admin/roles"
    );

    return response.data;
};

export const createRole = async (
    data: any
) => {
    const response = await api.post(
        "/admin/roles",
        data
    );

    return response.data;
};

export const updateRole = async (
    roleId: number,
    data: any
) => {
    const response = await api.put(
        `/admin/roles/${roleId}`,
        data
    );

    return response.data;
};

export const deleteRole = async (
    roleId: number
) => {
    const response = await api.delete(
        `/admin/roles/${roleId}`
    );

    return response.data;
};

export const getAnalytics = async () => {
    const response = await api.get(
        "/admin/analytics"
    );

    return response.data;
};

export const getUserGrowth = async () => {
    const response = await api.get(
        "/admin/analytics/user-growth"
    );

    return response.data;
};

export const getUserStatus = async () => {
    const response = await api.get(
        "/admin/analytics/user-status"
    );

    return response.data;
};

export const getRecentUsers = async () => {
    const response = await api.get(
        "/admin/analytics/recent-users"
    );

    return response.data;
};

export const getNotifications = async () => {
    const response = await api.get(
        "/admin/notifications"
    );

    return response.data;
};

export const getUnreadNotifications =
    async () => {

    const response = await api.get(
        "/admin/notifications/unread-count"
    );

    return response.data;
};  

export const markNotificationAsRead =
    async (
        notificationId: number
    ) => {
        const response = await api.put(
            `/admin/notifications/${notificationId}/read`
        );

        return response.data;
    };

export const getSettings = async () => {
    const response = await api.get(
        "/admin/settings"
    );

    return response.data;
};

export const updateSettings = async (
    data: any
) => {
    const response = await api.put(
        "/admin/settings",
        data
    );

    return response.data;
};

export const getAISettings = async () => {
    const response = await api.get(
        "/admin/ai-settings"
    );

    return response.data;
};

export const updateAISettings = async (
    data: any
) => {
    const response = await api.put(
        "/admin/ai-settings",
        data
    );

    return response.data;
};

export const getAuditLogs =
    async () => {

        const response =
            await api.get(
                "/admin/audit-logs"
            );

        return response.data;
    };

    
export const getSecuritySettings = async () => {

    const response =
        await api.get(
            "/admin/security/settings"
        );

    return response.data;
};

export const updateSecuritySettings = async (
    data: any
) => {

    const response =
        await api.put(
            "/admin/security/settings",
            data
        );

    return response.data;
};

export const getLoginActivity = async () => {
    const response = await api.get(
        "/admin/security/login-activity"
    );

    return response.data;
};

export const getActiveSessions =
    async () => {

        const response =
            await api.get(
                "/admin/security/active-sessions"
            );

        return response.data;
    };

export const getSecurityStats =
    async () => {

        const response =
            await api.get(
                "/admin/security/stats"
            );

        return response.data;
    };

export const revokeSession = async (
    sessionId: number
) => {
    const response = await api.delete(
        `/admin/security/active-sessions/${sessionId}`
    );

    return response.data;
};

export const revokeAllSessions =
    async () => {

        const response =
            await api.delete(
                "/admin/security/active-sessions"
            );

        return response.data;
    };