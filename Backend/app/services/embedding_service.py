from sentence_transformers import SentenceTransformer

# Shared model — must match ai_ranking.py so embeddings are comparable
model = SentenceTransformer(
    "sentence-transformers/all-mpnet-base-v2"
)

def generate_embedding(text: str):
    # normalize_embeddings=True ensures unit-length vectors,
    # making cosine similarity equivalent to dot-product in Qdrant
    return model.encode(text, normalize_embeddings=True).tolist()