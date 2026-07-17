import api from "@/lib/api";

export const getUserNotifications = async (
    userId: number
) => {
    const response = await api.get(
        `/notifications/${userId}`
    );

    return response.data;
};

export const getUnreadCount = async (
    userId: number
) => {
    const response = await api.get(
        `/notifications/unread/count/${userId}`
    );

    return response.data;
};

export const markNotificationRead = async (
    notificationId: number
) => {
    const response = await api.put(
        `/notifications/read/${notificationId}`
    );

    return response.data;
};

export const deleteNotification = async (
    notificationId: number
) => {
    const response = await api.delete(
        `/notifications/${notificationId}`
    );

    return response.data;
};