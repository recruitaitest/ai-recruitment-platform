import api from "@/lib/api";

export const getInterviews = async () => {
    const response = await api.get("/interviews");
    return response.data;
};

export const createInterview = async (data: any) => {
    const response = await api.post(
        "/interviews",
        data
    );

    return response.data;
};

export const updateInterview = async (
    interviewId: number,
    data: any
) => {
    const response = await api.put(
        `/interviews/${interviewId}`,
        data
    );

    return response.data;
};

export const deleteInterview = async (
    interviewId: number
) => {
    const response = await api.delete(
        `/interviews/${interviewId}`
    );

    return response.data;
};

export const submitInterviewFeedback = async (
    interviewId: number,
    data: any
) => {
    const response = await api.put(
        `/interviews/${interviewId}/feedback`,
        data
    );

    return response.data;
};