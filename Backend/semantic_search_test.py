import os
from dotenv import load_dotenv

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

query = "React developer with Node.js experience"

query_vector = model.encode(query).tolist()

results = client.search(
    collection_name="candidates",
    query_vector=query_vector,
    limit=5
)

for result in results:
    print(
        result.payload["full_name"],
        result.score
    )