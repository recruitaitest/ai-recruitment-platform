import os
from dotenv import load_dotenv

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

from app.database import SessionLocal
from app.models.candidate import Candidate
from app.services.embedding_service import generate_embedding

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

db = SessionLocal()

candidates = db.query(Candidate).all()

points = []

for candidate in candidates:

    skills_text = candidate.skills or ""
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

    points.append(
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
                "resume_text": candidate.resume_text
            }
        )
    )

if points:
    client.upsert(
        collection_name="candidates",
        points=points
    )

print(f"Re-indexed {len(points)} candidates successfully with all-mpnet-base-v2 (768-dim)")