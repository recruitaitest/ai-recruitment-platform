import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Delete existing collection if present (model dimension changed: 384 → 768)
collections = [c.name for c in client.get_collections().collections]
if "candidates" in collections:
    client.delete_collection("candidates")
    print("Deleted old 'candidates' collection (384-dim)")

client.create_collection(
    collection_name="candidates",
    vectors_config=VectorParams(
        size=3072,          # gemini-embedding-2 produces 3072-dim vectors
        distance=Distance.COSINE
    )
)

print("Collection 'candidates' created successfully (768-dim, COSINE)")