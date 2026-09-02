import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

from app.services.llm_factory import get_embedding_model

def generate_embedding(text: str):
    try:
        model = get_embedding_model()
        if model:
            return model.embed_query(text)
    except Exception as e:
        print(f"Primary embedding generation notice: {e}")

    # Fallback to Gemini embedding if configured in env
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            fallback_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=gemini_key)
            return fallback_model.embed_query(text)
        except Exception:
            pass

    # Default empty vector to avoid blocking
    return [0.0] * 768