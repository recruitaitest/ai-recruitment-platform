import api from "@/lib/api";

export const getPositions = async () => {
  const response = await api.get("/positions/");

  return response.data;
};

export const getRankedCandidates = async (
  positionId: number
) => {
  const response = await api.get(
    `/positions/${positionId}/match-candidates`
  );

  return response.data;
};