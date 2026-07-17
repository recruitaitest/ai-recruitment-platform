import api from "@/lib/api";

export const getOffers = async () => {
    const response = await api.get("/offers");
    return response.data;
};

export const getOffer = async (offerId: number) => {
    const response = await api.get(`/offers/${offerId}`);
    return response.data;
};

export const createOffer = async (data: any) => {
    const response = await api.post("/offers", data);
    return response.data;
};

export const updateOffer = async (
    offerId: number,
    data: any
) => {
    const response = await api.put(
        `/offers/${offerId}`,
        data
    );

    return response.data;
};

export const updateOfferStatus = async (
    offerId: number,
    status: string
) => {
    const response = await api.put(
        `/offers/${offerId}/status`,
        null,
        {
            params: {
                status,
            },
        }
    );

    return response.data;
};

export const deleteOffer = async (
    offerId: number
) => {
    const response = await api.delete(
        `/offers/${offerId}`
    );

    return response.data;
};

export const getOfferByPipeline = async (
    pipelineId: number
) => {

    const response = await api.get(
        `/offers/pipeline/${pipelineId}`
    );

    return response.data;

};

export const uploadOfferLetter = async (offerId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/offers/${offerId}/upload-letter`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
};

export const getOfferAnalytics = async () => {
    const response = await api.get("/offers/analytics/stats");
    return response.data;
};