from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.models.candidate import Candidate
from app.services.ai_ranking import client, _calibrate_score
from app.services.embedding_service import generate_embedding

def hybrid_search(db: Session, query: str, limit: int = 50):
    """
    Performs a Hybrid Search by combining PostgreSQL Full-Text Search (Exact Keywords)
    and Qdrant Vector Search (Semantic Meaning), scoring them via Reciprocal Rank Fusion (RRF).
    """
    
    # 1. Semantic Search (Qdrant)
    vector = generate_embedding(query)
    qdrant_results = client.search(
        collection_name="candidates",
        query_vector=vector,
        limit=limit,
        with_payload=True
    )
    
    # Map candidate_id -> Semantic Rank
    semantic_ranks = {}
    for rank, result in enumerate(qdrant_results, start=1):
        candidate_id = result.payload.get("candidate_id")
        if candidate_id:
            semantic_ranks[candidate_id] = rank

    # 2. Keyword Search (OpenSearch)
    from app.services.opensearch_indexer import opensearch_client, INDEX_NAME, init_opensearch
    
    keyword_ranks = {}
    if query.strip():
        # Ensure the index exists before searching to prevent 404 errors on fresh installs
        init_opensearch()
        
        search_body = {
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": ["full_name", "skills", "resume_text", "company", "location", "education"]
                }
            },
            "size": limit,
            "_source": False
        }
        
        try:
            os_results = opensearch_client.search(index=INDEX_NAME, body=search_body)
            hits = os_results.get("hits", {}).get("hits", [])
            for rank, hit in enumerate(hits, start=1):
                c_id = int(hit["_id"])
                keyword_ranks[c_id] = rank
        except Exception as e:
            print(f"OpenSearch error: {e}")

    # 3. Reciprocal Rank Fusion (RRF)
    # RRF Score = 1 / (k + rank), where k is a smoothing constant (usually 60)
    k = 60
    rrf_scores = {}
    
    # Collect all unique candidate IDs from both engines
    all_candidate_ids = set(semantic_ranks.keys()) | set(keyword_ranks.keys())
    
    for c_id in all_candidate_ids:
        s_rank = semantic_ranks.get(c_id, 1000) # Give poor rank if not found
        k_rank = keyword_ranks.get(c_id, 1000)
        
        score = (1 / (k + s_rank)) + (1 / (k + k_rank))
        rrf_scores[c_id] = score

    # Sort candidates by RRF score descending
    sorted_candidates = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    
    # Extract just the IDs
    best_candidate_ids = [c_id for c_id, score in sorted_candidates][:limit]
    
    # 4. Fetch actual Candidate objects from PostgreSQL in order
    if not best_candidate_ids:
        return []
        
    candidates = db.query(Candidate).filter(Candidate.id.in_(best_candidate_ids)).all()
    
    # Re-sort to match the RRF order
    candidate_dict = {c.id: c for c in candidates}
    ordered_candidates = [candidate_dict[c_id] for c_id in best_candidate_ids if c_id in candidate_dict]
    
    return ordered_candidates
