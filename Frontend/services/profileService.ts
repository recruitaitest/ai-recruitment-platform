import api from "@/lib/api";

export const updateProfile = async (
    userId: number,
    data: any
) => {
    const response = await api.put(
        `/users/profile/${userId}`,
        data
    );

    return response.data;
};

export const getProfile = async (
    userId: number
) => {
    const response = await api.get(
        `/users/profile/${userId}`
    );

    return response.data;
};

export const uploadProfilePhoto = async (
    userId: number,
    file: File
) => {

    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    const response = await api.post(
        `/users/profile-photo/${userId}`,
        formData,
        {
            headers: {
                "Content-Type":
                    "multipart/form-data"
            }
        }
    );

    return response.data;
};

export const removeProfilePhoto = async (
    userId: number
) => {

    const response = await api.delete(
        `/users/profile-photo/${userId}`
    );

    return response.data;
};