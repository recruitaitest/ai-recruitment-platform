import os

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

from app.services.embedding_service import generate_embedding

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

_collection_verified = False

def ensure_collection_exists(vector_size: int = 768):
    global _collection_verified
    if _collection_verified:
        return
    try:
        collections = [c.name for c in client.get_collections().collections]
        if "candidates" not in collections:
            client.create_collection(
                collection_name="candidates",
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )
        _collection_verified = True
    except Exception as e:
        print(f"Notice verifying Qdrant collection: {e}")


def index_candidate(candidate):
    try:
        skills_text = candidate.skills or ""
        
        # Repeat skills 3x to amplify their embedding weight.
        # Resume text carries a lot of noise; repeating skills explicitly
        # ensures the model encodes them as primary signal.
        repeated_skills = " ".join([skills_text] * 3)

        candidate_text = f"""
        Professional Profile:
        Name: {candidate.full_name or ""}

        Technical Skills: {repeated_skills}

        Education Background: {candidate.education or ""}

        Work Experience: {candidate.experience or 0} years of professional experience.

        Location: {candidate.location or ""}

        Resume Summary:
        {candidate.resume_text or ""}
        """

        embedding = generate_embedding(candidate_text)
        ensure_collection_exists(len(embedding) if embedding else 768)

        client.upsert(
            collection_name="candidates",
            points=[
                PointStruct(
                    id=candidate.id,
                    vector=embedding,
                    payload={
                        "candidate_id": candidate.id,
                        "full_name": candidate.full_name,
                        "email": candidate.email,
                        "skills": candidate.skills,
                        "location": candidate.location,
                        "experience": candidate.experience,
                        "resume_text": candidate.resume_text,
                    }
                )
            ]
        )
        print(f"Successfully indexed candidate {candidate.id} to Qdrant.")
    except Exception as e:
        print(f"Warning: Failed to index to Qdrant: {e}")

def delete_candidate_index(candidate_id: int):
    try:
        client.delete(
            collection_name="candidates",
            points_selector=[candidate_id]
        )
    except Exception as e:
        print(f"Failed to delete candidate {candidate_id} from Qdrant: {e}")