import api from "@/lib/api";

export interface AutomationRule {
  id?: number;
  rule_name: string;
  is_active: boolean;
  auto_advance_enabled: boolean;
  auto_advance_score_threshold: number;
  target_advance_stage: string;
  auto_reject_enabled: boolean;
  auto_reject_score_cutoff: number;
  rejection_delay_hours: number;
  rejection_email_template?: string;
  auto_tagging_enabled: boolean;
  auto_archive_inactive_days: number;
}

export interface WebhookEndpoint {
  id?: number;
  name: string;
  target_url: string;
  secret_key?: string;
  is_active: boolean;
  subscribed_events: string[];
}

export interface OfferLetterRequest {
  candidate_id: number;
  position_title: string;
  offered_ctc: number;
  joining_date: string;
  location?: string;
}

// ── API Calls ──────────────────────────────────────────────────────────────────

export const getAutomationRules = async () => {
  const response = await api.get("/api/automation/rules");
  return response.data;
};

export const updateAutomationRules = async (data: Partial<AutomationRule>) => {
  const response = await api.post("/api/automation/rules", data);
  return response.data;
};

export const getWebhooks = async () => {
  const response = await api.get("/api/automation/webhooks");
  return response.data;
};

export const createWebhook = async (data: Partial<WebhookEndpoint>) => {
  const response = await api.post("/api/automation/webhooks", data);
  return response.data;
};

export const deleteWebhook = async (id: number) => {
  const response = await api.delete(`/api/automation/webhooks/${id}`);
  return response.data;
};

export const uploadBulkZipResumes = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/automation/bulk-zip-upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const generateOfferLetterApi = async (data: OfferLetterRequest) => {
  const response = await api.post("/api/automation/generate-offer-letter", data);
  return response.data;
};

export const archiveInactivePositionsApi = async () => {
  const response = await api.post("/api/automation/archive-inactive-positions");
  return response.data;
};
