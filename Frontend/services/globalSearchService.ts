import api from "@/lib/api";

export const globalSearch = async (query: string) => {
    if (!query.trim()) return [];

    const response = await api.get("/global-search", {
        params: {
            q: query,
        },
    });

    return response.data;
};