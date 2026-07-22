import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

# Initialize Gemini Embeddings
model = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-2",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def generate_embedding(text: str):
    # Gemini API expects text, returns list of floats
    return model.embed_query(text)