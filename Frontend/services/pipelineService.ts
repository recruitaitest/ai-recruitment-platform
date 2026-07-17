import api from "@/lib/api";

export const getPipelineData = async () => {
  const response = await api.get("/pipelines");
  return response.data;
};

export const createPipeline = async (data: any) => {
  const response = await api.post(
    "/pipelines",
    data
  );
  return response.data;
};

export const updatePipeline = async (
  pipelineId: number,
  data: any
) => {
  const response = await api.put(
    `/pipelines/${pipelineId}`,
    data
  );
  return response.data;
};

export const deletePipeline = async (
  pipelineId: number
) => {
  const response = await api.delete(
    `/pipelines/${pipelineId}`
  );
  return response.data;
};

export const getPipelineHistory = async (
  pipelineId: number
) => {
  const response = await api.get(
    `/pipelines/${pipelineId}/history`
  );

  return response.data;
};