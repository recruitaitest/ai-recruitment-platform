import os

from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

load_dotenv()

router = APIRouter()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


class SemanticSearchRequest(BaseModel):
    query: str


@router.post("/")
def semantic_search(request: SemanticSearchRequest):

    query_vector = model.encode(
        request.query
    ).tolist()

    results = client.search(
        collection_name="candidates",
        query_vector=query_vector,
        limit=10
    )

    candidates = []

    for result in results:

        candidates.append({
            "candidate_id": result.payload.get("candidate_id"),
            "full_name": result.payload.get("full_name"),
            "email": result.payload.get("email"),
            "skills": result.payload.get("skills"),
            "location": result.payload.get("location"),
            "experience": result.payload.get("experience"),
            "score": float(result.score)
        })

    return candidates