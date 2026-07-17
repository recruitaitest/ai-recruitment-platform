import os
from dotenv import load_dotenv

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# all-mpnet-base-v2: 768-dim, significantly stronger semantic understanding
# than all-MiniLM-L6-v2 (384-dim). Better cosine similarity quality,
# especially for domain-specific resume/JD matching.
model = SentenceTransformer(
    "sentence-transformers/all-mpnet-base-v2"
)


def _calibrate_score(raw_cosine: float) -> float:
    """
    Calibrate raw cosine similarity to a better 0–1 match score.
    
    all-mpnet-base-v2 cosine scores for resume-JD pairs typically
    land in [0.25, 0.75]. We rescale this range to [0, 1] so that
    a perfect skill/experience match approaches 1.0 and a completely
    unrelated document approaches 0.
    
    Formula: clamp((score - low) / (high - low), 0, 1)
    Where low=0.20, high=0.75 are empirical anchors.
    """
    low, high = 0.20, 0.75
    calibrated = (raw_cosine - low) / (high - low)
    return max(0.0, min(1.0, calibrated))


def get_semantic_score(position_text: str, candidate_id: int):

    vector = model.encode(
        position_text,
        normalize_embeddings=True
    ).tolist()

    results = client.search(
        collection_name="candidates",
        query_vector=vector,
        limit=200,
        with_payload=True
    )

    for result in results:
        if result.payload.get("candidate_id") == candidate_id:
            return _calibrate_score(result.score)

    return 0.0