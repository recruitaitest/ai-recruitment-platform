from pydantic import BaseModel


class AISettingsUpdate(
    BaseModel
):
    semantic_search: bool
    ai_candidate_ranking: bool
    resume_auto_parsing: bool