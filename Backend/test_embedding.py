from sentence_transformers import SentenceTransformer

print("Loading model...")

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

embedding = model.encode(
    "Python React FastAPI Developer"
)

print("Embedding Length:", len(embedding))