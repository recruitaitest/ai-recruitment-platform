import api from "@/lib/api";

export const getCandidates = async () => {
    const response = await api.get("/candidates/");
    return response.data;
};

export const getCandidateById = async (candidateId: number) => {
    const response = await api.get(`/candidates/${candidateId}`);
    return response.data;
};

export const parseResume = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/candidates/parse-resume", formData);
    return response.data;
};

export const searchCandidatesComprehensive = async (searchParams: {
    query?: string;
    skills?: string[];
    min_experience?: number;
    max_experience?: number;
    location?: string;
    job_description?: string;
}) => {
    const response = await api.post("/search/comprehensive", searchParams);
    return response.data;
};