import api from "@/lib/api";

export interface AnalyticsFilterParams {
    dateRange?: string;
    recruiterId?: string | number;
    roleId?: string | number;
}

const buildQueryParams = (params?: AnalyticsFilterParams) => {
    const query = new URLSearchParams();
    if (params?.dateRange) query.append("date_range", params.dateRange);
    if (params?.roleId) query.append("position_id", String(params.roleId));
    if (params?.recruiterId) query.append("recruiter_id", String(params.recruiterId));
    const str = query.toString();
    return str ? `?${str}` : "";
};

export const getDashboardAnalytics = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/dashboard${buildQueryParams(params)}`);
    return response.data;
};

export const getPipelineStats = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/pipeline-stats${buildQueryParams(params)}`);
    return response.data;
};

export const getTopSkills = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/top-skills${buildQueryParams(params)}`);
    return response.data;
};

export const getInterviewStats = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/interview-stats${buildQueryParams(params)}`);
    return response.data;
};

export const getHiringTrends = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/hiring-trends${buildQueryParams(params)}`);
    return response.data;
};

export const getTimeToHire = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/time-to-hire${buildQueryParams(params)}`);
    return response.data;
};

export const getOfferDeclineAnalytics = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/offer-decline${buildQueryParams(params)}`);
    return response.data;
};

export const getInterviewPredictor = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/interview-predictor${buildQueryParams(params)}`);
    return response.data;
};

export const getCandidateQualityScore = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/quality-score${buildQueryParams(params)}`);
    return response.data;
};

export const getRejectionReasons = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/rejection-reasons${buildQueryParams(params)}`);
    return response.data;
};

export const getSourceAnalytics = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/source-analytics${buildQueryParams(params)}`);
    return response.data;
};

export const getAiRecommendations = async (params?: AnalyticsFilterParams) => {
    const response = await api.get(`/analytics/ai-recommendations${buildQueryParams(params)}`);
    return response.data;
};

export const scanBiasDetection = async (note: string) => {
    const response = await api.post("/analytics/bias-detection", { note });
    return response.data;
};