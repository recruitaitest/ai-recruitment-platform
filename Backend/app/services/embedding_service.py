import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Initialize Gemini Embeddings
model = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def generate_embedding(text: str):
    # Gemini API expects text, returns list of floats
    return model.embed_query(text)