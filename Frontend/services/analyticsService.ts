import api from "@/lib/api";

export const getDashboardAnalytics = async () => {
    const response = await api.get("/analytics/dashboard");
    return response.data;
};

export const getPipelineStats = async () => {
    const response = await api.get("/analytics/pipeline-stats");
    return response.data;
};

export const getTopSkills = async () => {
    const response = await api.get("/analytics/top-skills");
    return response.data;
};

export const getInterviewStats = async () => {
    const response = await api.get("/analytics/interview-stats");
    return response.data;
};

export const getHiringTrends = async () => {
    const response = await api.get("/analytics/hiring-trends");
    return response.data;
};

export const getTimeToHire = async () => {
    const response = await api.get("/analytics/time-to-hire");
    return response.data;
};