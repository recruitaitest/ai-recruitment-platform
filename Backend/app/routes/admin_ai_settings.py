from fastapi import (
    APIRouter,
    Depends
)
from app.auth.permissions import require_permission
from app.utils.jwt_handler import get_current_user
from typing import Optional, Dict, Any
from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.ai_settings import (
    AISettings
)

from app.schemas.ai_settings_schema import (
    AISettingsUpdate
)

router = APIRouter(
    prefix="/admin/ai-settings",
    tags=["AI Settings"]
)

class TestConnectionRequest(BaseModel):
    provider: str
    config: Dict[str, Any]  # the specific provider's config dict (apiKey/serverUrl/modelName)

@router.post("/test-connection")
def test_ai_connection(
    payload: TestConnectionRequest,
    current_user = Depends(require_permission("ai_settings.view,ai_search.view"))
):
    """
    Actually tests connectivity to the chosen AI provider using the
    config passed from the UI (before saving).  Returns success/error + latency.
    """
    import time
    provider = payload.provider
    cfg = payload.config
    start = time.time()

    try:
        if provider == "Ollama":
            import requests
            server_url = cfg.get("serverUrl", "http://localhost:11434").rstrip("/")
            model = cfg.get("modelName", "llama3")
            resp = requests.get(f"{server_url}/api/tags", timeout=5)
            resp.raise_for_status()
            available_models = [m["name"] for m in resp.json().get("models", [])]
            model_ok = any(model in m for m in available_models)
            latency_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "source": "UI",
                "latency_ms": latency_ms,
                "message": f"Ollama server is reachable ({latency_ms}ms). "
                           f"Model '{model}' {'found ✓' if model_ok else 'not pulled yet – run: ollama pull ' + model}",
                "available_models": available_models[:10],
            }

        elif provider == "Groq":
            from groq import Groq
            api_key = cfg.get("apiKey", "")
            if not api_key:
                return {"success": False, "source": "UI", "message": "No API key provided."}
            client = Groq(api_key=api_key)
            models = client.models.list()
            chat_models = [m.id for m in models.data if "whisper" not in m.id and "guard" not in m.id]
            latency_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "source": "UI",
                "latency_ms": latency_ms,
                "message": f"Groq API key is valid ({latency_ms}ms). {len(models.data)} models available.",
                "available_models": chat_models,
            }

        elif provider == "Gemini":
            import requests
            api_key = cfg.get("apiKey", "")
            if not api_key:
                return {"success": False, "source": "UI", "message": "No API key provided."}
            
            model = cfg.get("modelName", "gemini-1.5-flash")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}?key={api_key}"
            resp = requests.get(url, timeout=10)
            latency_ms = int((time.time() - start) * 1000)
            
            if resp.status_code == 200:
                return {
                    "success": True,
                    "source": "UI",
                    "latency_ms": latency_ms,
                    "message": f"Gemini API key is valid ({latency_ms}ms). Model '{model}' ready ✓",
                }
            else:
                try:
                    err_msg = resp.json().get("error", {}).get("message", f"HTTP {resp.status_code}")
                except Exception:
                    err_msg = f"HTTP {resp.status_code} - {resp.text[:100]}"
                return {
                    "success": False,
                    "source": "UI",
                    "latency_ms": latency_ms,
                    "message": f"Gemini connection failed: {err_msg}",
                }

        elif provider == "OpenAI":
            from openai import OpenAI
            api_key = cfg.get("apiKey", "")
            if not api_key:
                return {"success": False, "source": "UI", "message": "No API key provided."}
            client = OpenAI(api_key=api_key)
            models = client.models.list()
            latency_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "source": "UI",
                "latency_ms": latency_ms,
                "message": f"OpenAI API key is valid ({latency_ms}ms).",
            }

        elif provider == "Claude":
            import anthropic
            api_key = cfg.get("apiKey", "")
            if not api_key:
                return {"success": False, "source": "UI", "message": "No API key provided."}
            client = anthropic.Anthropic(api_key=api_key)
            # Anthropic doesn't have a models list endpoint — do a minimal completion
            msg = client.messages.create(
                model=cfg.get("modelName", "claude-3-5-sonnet-20240620"),
                max_tokens=5,
                messages=[{"role": "user", "content": "ping"}]
            )
            latency_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "source": "UI",
                "latency_ms": latency_ms,
                "message": f"Claude API key is valid ({latency_ms}ms).",
            }

        elif provider == "Hugging Face":
            import requests
            api_key = cfg.get("apiKey", "").strip()
            if not api_key:
                return {"success": False, "source": "UI", "message": "No API key provided."}
            
            headers = {"Authorization": f"Bearer {api_key}"}
            resp = requests.get("https://huggingface.co/api/whoami-v2", headers=headers, timeout=5)
            if resp.status_code == 401:
                return {
                    "success": False,
                    "source": "UI",
                    "message": "Invalid Hugging Face Token (401 Unauthorized). Ensure your token starts with 'hf_' and includes User Information Read permission."
                }
            resp.raise_for_status()
            data = resp.json()
            name = data.get("name") or data.get("username") or "user"
            latency_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "source": "UI",
                "latency_ms": latency_ms,
                "message": f"Hugging Face token valid ({latency_ms}ms). Account: {name}",
            }

        else:
            return {"success": False, "message": f"Unknown provider: {provider}"}

    except Exception as e:
        latency_ms = int((time.time() - start) * 1000)
        return {
            "success": False,
            "source": "UI",
            "latency_ms": latency_ms,
            "message": f"Connection failed: {str(e)}",
        }


@router.get("")
@router.get("/")
def get_ai_settings(
    db: Session = Depends(get_db)
):
    import os
    settings = (
        db.query(AISettings)
        .first()
    )

    if not settings:
        settings = AISettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # If no provider has been saved yet, derive it from env vars so badge always shows
    if not settings.active_provider:
        use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"
        ollama_url = os.getenv("OLLAMA_BASE_URL", "")
        settings.active_provider = "Ollama" if (use_ollama and ollama_url) else "Groq"

    return settings

@router.put("")
@router.put("/")
def update_ai_settings(
    payload: AISettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("ai_settings.manage"))
):

    settings = (
        db.query(AISettings)
        .first()
    )

    if not settings:

        settings = AISettings()

        db.add(settings)

    settings.semantic_search = (
        payload.semantic_search
    )

    settings.ai_candidate_ranking = (
        payload.ai_candidate_ranking
    )

    settings.resume_auto_parsing = (
        payload.resume_auto_parsing
    )
    
    if payload.active_provider is not None:
        settings.active_provider = payload.active_provider
    if payload.provider_config is not None:
        # Use a fresh copy so SQLAlchemy detects the mutation on the JSON column
        import copy
        from sqlalchemy.orm.attributes import flag_modified
        settings.provider_config = copy.deepcopy(payload.provider_config)
        flag_modified(settings, "provider_config")

    db.commit()

    try:
        from app.utils.audit import create_audit_log
        create_audit_log(
            db=db,
            user_email=current_user.get("email", "unknown"),
            action="UPDATE",
            entity="AI_SETTINGS",
            description="Updated AI settings"
        )
    except Exception as e:
        print(f"Failed to create audit log: {e}")

    return {
        "success": True,
        "message": "AI Settings updated successfully"
    }