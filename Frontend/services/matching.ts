import api from "@/lib/api";

export const getMatchingCandidates = async (positionId: number) => {
  const response = await api.get(`/matching/position/${positionId}`);

  return response.data;
};
