import api from "@/lib/api";

export const getNotifications = async (
    userId: number
) => {
    const response = await api.get(
        `/notification-settings/${userId}`
    );

    return response.data;
};

export const updateNotifications = async (
    userId: number,
    data: any
) => {
    const response = await api.put(
        `/notification-settings/${userId}`,
        data
    );

    return response.data;
};