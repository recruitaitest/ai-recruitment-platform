import { toast } from "sonner";

const AI_TOKENS_STORAGE_KEY = "ai_tokens_balance";
const DEFAULT_INITIAL_TOKENS = 2500;

export function getAiTokenBalance(): number {
  if (typeof window === "undefined") return DEFAULT_INITIAL_TOKENS;
  const stored = localStorage.getItem(AI_TOKENS_STORAGE_KEY);
  if (stored === null) {
    localStorage.setItem(AI_TOKENS_STORAGE_KEY, String(DEFAULT_INITIAL_TOKENS));
    return DEFAULT_INITIAL_TOKENS;
  }
  const parsed = parseInt(stored, 10);
  return isNaN(parsed) ? DEFAULT_INITIAL_TOKENS : parsed;
}

export function deductAiTokens(amount: number = 10): number {
  if (typeof window === "undefined") return DEFAULT_INITIAL_TOKENS;
  const current = getAiTokenBalance();
  const next = Math.max(0, current - amount);
  localStorage.setItem(AI_TOKENS_STORAGE_KEY, String(next));
  window.dispatchEvent(new CustomEvent("ai-tokens-changed", { detail: { balance: next } }));
  return next;
}

export function checkAiTokenAvailability(requiredAmount: number = 1): boolean {
  if (typeof window === "undefined") return true;

  const current = getAiTokenBalance();
  if (current <= 0 || current < requiredAmount) {
    toast.error("⚠️ AI Agent is out of tokens. Please check your settings or top up your balance.", {
      duration: 5000,
    });
    return false;
  }
  return true;
}

export function handleAiApiError(error: any, responseStatus?: number): void {
  const errMsg = (
    (typeof error === "string" ? error : "") ||
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    error?.detail ||
    error?.error ||
    ""
  ).toLowerCase();

  const status = responseStatus || error?.response?.status || error?.status;

  if (
    status === 429 ||
    status === 402 ||
    errMsg.includes("quota") ||
    errMsg.includes("token") ||
    errMsg.includes("exceeded") ||
    errMsg.includes("insufficient_quota") ||
    errMsg.includes("rate_limit") ||
    errMsg.includes("credit") ||
    errMsg.includes("resource_exhausted")
  ) {
    toast.error("⚠️ AI Agent is not responding: Out of tokens or quota limit reached. Please check your AI settings.", {
      duration: 5000,
    });
  } else if (
    status === 503 ||
    status === 504 ||
    errMsg.includes("timeout") ||
    errMsg.includes("not responding") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("failed to fetch") ||
    errMsg.includes("network error")
  ) {
    toast.error("⚠️ AI Agent is not responding. Please check your AI provider configuration in Settings.", {
      duration: 5000,
    });
  } else if (errMsg) {
    toast.error(error?.response?.data?.detail || error?.message || error?.detail || "AI action failed. Please try again.");
  }
}
