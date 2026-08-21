import logging
from app.database import SessionLocal
from app.models.ai_settings import AISettings

logger = logging.getLogger(__name__)

def get_current_ai_settings():
    """
    Reads the active provider and its configuration strictly from the Database.
    All AI configurations and API keys are managed exclusively via the UI dedicated page (/admin/ai).
    """
    try:
        db = SessionLocal()
        try:
            settings = db.query(AISettings).first()
            if not settings or not settings.active_provider:
                return None, {}
            return settings.active_provider, settings.provider_config or {}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error fetching AI settings from DB: {e}")
        return None, {}

def get_chat_model(
    temperature: float = 0.2,
    json_mode: bool = False,
    override_provider: str = None,
    override_api_key: str = None,
    override_model_name: str = None,
    override_server_url: str = None
):
    """
    Instantiates the Chat LLM model strictly using the configuration set via the UI page (/admin/ai)
    or optional runtime overrides passed in the request.
    """
    db_provider, config = get_current_ai_settings()
    provider = override_provider or db_provider
    
    if not provider:
        print("[LLM Factory] No AI Provider configured in UI settings or request override.")
        return None
        
    print(f"[LLM Factory] Initializing {provider} Chat Model (JSON: {json_mode})")
    
    provider_settings = config.get(provider, {})
    model_name = override_model_name or provider_settings.get("modelName")
    api_key = override_api_key or provider_settings.get("apiKey")
    server_url = override_server_url or provider_settings.get("serverUrl")
    
    if provider == "Ollama":
        url = server_url or "http://localhost:11434"
        target_model = model_name or "llama3"
        
        # Test if custom Ollama server is live
        ollama_live = False
        try:
            import urllib.request, json
            req = urllib.request.Request(f"{url.rstrip('/')}/api/tags", headers={"User-Agent": "FastAPI"})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                if resp.status == 200:
                    ollama_live = True
                    data = json.loads(resp.read().decode())
                    avail_models = [m.get("name") for m in data.get("models", []) if isinstance(m, dict)]
                    
                    if avail_models and not any(target_model.split(':')[0] in m for m in avail_models):
                        chat_models = [m for m in avail_models if "embed" not in m.lower()]
                        if chat_models:
                            target_model = chat_models[0]
                            print(f"  -> Auto-selected installed Ollama chat model: '{target_model}'")
        except Exception as e:
            print(f"  -> Ollama reachability check warning: {e}")
            ollama_live = False

        if ollama_live:
            from langchain_ollama import ChatOllama
            kwargs = {
                "model": target_model,
                "base_url": url,
                "temperature": temperature,
                "timeout": 45.0
            }
            if json_mode:
                kwargs["format"] = "json"
            return ChatOllama(**kwargs)
        else:
            print(f"  -> Ollama server at {url} is unreachable.")
            return None

    elif provider == "Groq":
        if not api_key:
            print("  -> Groq API Key missing in UI settings.")
            return None
            
        from langchain_groq import ChatGroq
        valid_model = model_name or "llama-3.3-70b-versatile"
        # Auto-map deprecated / sunset / invalid Groq model names to currently active Groq models
        deprecated_or_invalid = [
            "llama3-70b-8192", "llama3-8b-8192", "llama-3.1-70b-versatile",
            "llama-3.1-8b-instant", "llama3-8b", "llama3-70b", "llama-3.1-8b"
        ]
        if valid_model in deprecated_or_invalid:
            valid_model = "llama-3.3-70b-versatile"
        kwargs = {"model": valid_model, "temperature": temperature, "api_key": api_key}
        if json_mode:
            kwargs["model_kwargs"] = {"response_format": {"type": "json_object"}}
        return ChatGroq(**kwargs)

    elif provider == "Gemini":
        if not api_key:
            print("  -> Gemini API Key missing in UI settings.")
            return None
            
        from langchain_google_genai import ChatGoogleGenerativeAI
        valid_model = model_name or "gemini-1.5-pro"
        if valid_model in ["gemini-pro", "gemini-1.0-pro"]:
            valid_model = "gemini-1.5-pro"
            
        return ChatGoogleGenerativeAI(model=valid_model, temperature=temperature, google_api_key=api_key)

    elif provider == "OpenAI":
        if not api_key:
            print("  -> OpenAI API Key missing in UI settings.")
            return None
            
        from langchain_openai import ChatOpenAI
        kwargs = {"model": model_name or "gpt-4o", "temperature": temperature, "api_key": api_key}
        if json_mode:
            kwargs["model_kwargs"] = {"response_format": {"type": "json_object"}}
        return ChatOpenAI(**kwargs)

    elif provider == "Claude":
        if not api_key:
            print("  -> Claude API Key missing in UI settings.")
            return None
            
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model_name=model_name or "claude-3-5-sonnet-20240620", temperature=temperature, api_key=api_key)

    elif provider == "Hugging Face":
        if not api_key:
            print("  -> Hugging Face API Token missing in UI settings.")
            return None
            
        from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
        endpoint_kwargs = {
            "repo_id": model_name or "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "temperature": max(0.01, temperature) if temperature == 0.0 else temperature,
            "huggingfacehub_api_token": api_key,
        }
        if json_mode:
            endpoint_kwargs["stop_sequences"] = ["}"]
        llm = HuggingFaceEndpoint(**endpoint_kwargs)
        return ChatHuggingFace(llm=llm)

    return None

def get_embedding_model():
    """
    Instantiates the Embedding Model strictly using configuration set via UI page (/admin/ai).
    """
    provider, config = get_current_ai_settings()
    if not provider:
        return None
        
    provider_settings = config.get(provider, {})
    embedding_model_name = provider_settings.get("embeddingModelName")
    api_key = provider_settings.get("apiKey")
    server_url = provider_settings.get("serverUrl")
    
    if provider == "Ollama":
        from langchain_ollama import OllamaEmbeddings
        return OllamaEmbeddings(
            model=embedding_model_name or "nomic-embed-text",
            base_url=server_url or "http://localhost:11434"
        )
    elif provider == "Gemini" and api_key:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        return GoogleGenerativeAIEmbeddings(
            model=embedding_model_name or "models/gemini-embedding-2",
            google_api_key=api_key
        )
    elif provider == "OpenAI" and api_key:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(
            model=embedding_model_name or "text-embedding-3-small",
            api_key=api_key
        )
    elif provider == "Hugging Face" and api_key:
        from langchain_huggingface import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(
            model_name=embedding_model_name or "BAAI/bge-large-en-v1.5"
        )
        
    return None
