import api from "@/lib/api";

export const getNotifications = async (
    userId: number
) => {
    const response = await api.get(
        `/notifications/${userId}`
    );

    return response.data;
};

export const updateNotifications = async (
    userId: number,
    data: any
) => {
    const response = await api.put(
        `/notifications/${userId}`,
        data
    );

    return response.data;
};