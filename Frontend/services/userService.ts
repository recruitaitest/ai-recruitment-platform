import api from "@/lib/api";

export const changePassword = async (
    userId: number,
    data: any
) => {
    const response = await api.put(
        `/users/change-password/${userId}`,
        data
    );

    return response.data;
};