from pydantic import BaseModel


from typing import Optional, Dict, Any

class AISettingsUpdate(
    BaseModel
):
    semantic_search: bool
    ai_candidate_ranking: bool
    resume_auto_parsing: bool
    active_provider: Optional[str] = "Ollama"
    provider_config: Optional[Dict[str, Any]] = None