import os
from dotenv import load_dotenv
from app.database import SessionLocal
from app.models.ai_settings import AISettings

load_dotenv()

# Initialize lazily to prevent massive memory usage on startup
_embedding_model = None

def get_current_ai_settings():
    """
    Reads the active provider and its config from the DB.
    Falls back to .env-based defaults if the DB columns don't exist yet
    (e.g. before the Alembic migration runs) so the server can still start.
    """
    try:
        db = SessionLocal()
        try:
            settings = db.query(AISettings).first()
            if not settings:
                return _env_fallback()
            provider = settings.active_provider or None
            config = settings.provider_config or {}
            if not provider:
                return _env_fallback()
            return provider, config
        except Exception:
            # Column may not exist yet (migration pending) — fall back silently
            return _env_fallback()
        finally:
            db.close()
    except Exception:
        return _env_fallback()

def _env_fallback():
    """Returns the provider + config derived purely from .env variables."""
    use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"
    ollama_url = os.getenv("OLLAMA_BASE_URL", "")
    if use_ollama and ollama_url:
        print("[LLM Factory] Falling back to .env → Ollama")
        return "Ollama", {
            "Ollama": {
                "serverUrl": ollama_url,
                "modelName": os.getenv("OLLAMA_MODEL", "llama3"),
                "embeddingModelName": os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"),
            }
        }
    print("[LLM Factory] Falling back to .env → Groq")
    return "Groq", {
        "Groq": {
            "apiKey": os.getenv("GROQ_API_KEY", ""),
            "modelName": "llama-3.3-70b-versatile",
        }
    }

def get_chat_model(temperature=0.2, json_mode=False):
    provider, config = get_current_ai_settings()
    
    print(f"[LLM Factory] Initializing {provider} Chat Model (JSON: {json_mode})")
    
    provider_settings = config.get(provider, {})
    model_name = provider_settings.get("modelName")
    
    if provider == "Ollama":
        from langchain_ollama import ChatOllama
        server_url = provider_settings.get("serverUrl") or "http://localhost:11434"
        print(f"  -> Source: Using Ollama URL from {'UI' if provider_settings.get('serverUrl') else 'default fallback'}")
        
        kwargs = {
            "model": model_name or "llama3",
            "base_url": server_url,
            "temperature": temperature
        }
        if json_mode:
            kwargs["format"] = "json"
            
        return ChatOllama(**kwargs)
        
    elif provider == "Groq":
        from langchain_groq import ChatGroq
        has_ui_key = bool(provider_settings.get("apiKey"))
        api_key = provider_settings.get("apiKey") or os.getenv("GROQ_API_KEY", "dummy_key")
        print(f"  -> Source: Using Groq API Key from {'UI' if has_ui_key else '.env'}")
        
        return ChatGroq(
            model=model_name or "llama-3.3-70b-versatile",
            temperature=temperature,
            api_key=api_key
        )
        
    elif provider == "Gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        has_ui_key = bool(provider_settings.get("apiKey"))
        api_key = provider_settings.get("apiKey") or os.getenv("GOOGLE_API_KEY")
        print(f"  -> Source: Using Gemini API Key from {'UI' if has_ui_key else '.env'}")
        
        return ChatGoogleGenerativeAI(
            model=model_name or "gemini-1.5-pro",
            temperature=temperature,
            google_api_key=api_key
        )
        
    elif provider == "OpenAI":
        from langchain_openai import ChatOpenAI
        has_ui_key = bool(provider_settings.get("apiKey"))
        api_key = provider_settings.get("apiKey") or os.getenv("OPENAI_API_KEY")
        print(f"  -> Source: Using OpenAI API Key from {'UI' if has_ui_key else '.env'}")
        
        return ChatOpenAI(
            model=model_name or "gpt-4o",
            temperature=temperature,
            api_key=api_key
        )
        
    elif provider == "Claude":
        from langchain_anthropic import ChatAnthropic
        has_ui_key = bool(provider_settings.get("apiKey"))
        api_key = provider_settings.get("apiKey") or os.getenv("ANTHROPIC_API_KEY")
        print(f"  -> Source: Using Claude API Key from {'UI' if has_ui_key else '.env'}")
        
        return ChatAnthropic(
            model_name=model_name or "claude-3-5-sonnet-20240620",
            temperature=temperature,
            api_key=api_key
        )

    elif provider == "Hugging Face":
        from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
        has_ui_key = bool(provider_settings.get("apiKey"))
        api_key = provider_settings.get("apiKey") or os.getenv("HUGGINGFACEHUB_API_TOKEN")
        print(f"  -> Source: Using Hugging Face API Key from {'UI' if has_ui_key else '.env'}")
        
        llm = HuggingFaceEndpoint(
            repo_id=model_name or "mistralai/Mixtral-8x7B-Instruct-v0.1",
            temperature=temperature,
            huggingfacehub_api_token=api_key,
        )
        return ChatHuggingFace(llm=llm)
        
    else:
        # Fallback
        from langchain_ollama import ChatOllama
        return ChatOllama(model="llama3", base_url="http://localhost:11434")

def get_embedding_model():
    provider, config = get_current_ai_settings()
    
    # Check if we should use a different provider for embedding? 
    # Usually they are tied to the same provider, but we have embeddingModelName
    
    provider_settings = config.get(provider, {})
    embedding_model_name = provider_settings.get("embeddingModelName")
    
    print(f"[LLM Factory] Initializing {provider} Embedding Model")
    
    if provider == "Ollama":
        from langchain_ollama import OllamaEmbeddings
        server_url = provider_settings.get("serverUrl", "http://localhost:11434")
        return OllamaEmbeddings(
            model=embedding_model_name or "nomic-embed-text",
            base_url=server_url
        )
        
    elif provider == "Gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        api_key = provider_settings.get("apiKey") or os.getenv("GOOGLE_API_KEY")
        return GoogleGenerativeAIEmbeddings(
            model=embedding_model_name or "models/gemini-embedding-2",
            google_api_key=api_key
        )
        
    elif provider == "OpenAI":
        from langchain_openai import OpenAIEmbeddings
        api_key = provider_settings.get("apiKey") or os.getenv("OPENAI_API_KEY")
        return OpenAIEmbeddings(
            model=embedding_model_name or "text-embedding-3-small",
            api_key=api_key
        )
        
    elif provider == "Hugging Face":
        from langchain_huggingface import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(
            model_name=embedding_model_name or "BAAI/bge-large-en-v1.5"
        )
        
    else:
        # Fallback to Ollama if embedding isn't supported natively by the provider tab config (like Groq)
        from langchain_ollama import OllamaEmbeddings
        return OllamaEmbeddings(model="nomic-embed-text", base_url="http://localhost:11434")
