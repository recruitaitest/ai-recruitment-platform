import os
from opensearchpy import OpenSearch
from opensearchpy.exceptions import NotFoundError
from app.models.candidate import Candidate

# Setup OpenSearch client
host = os.getenv("OPENSEARCH_HOST", "localhost")
port = int(os.getenv("OPENSEARCH_PORT", 9200))
auth = (os.getenv("OPENSEARCH_USER", "admin"), os.getenv("OPENSEARCH_PASS", "admin"))

# Determine if we should use SSL. Localhost typically doesn't use SSL for OpenSearch.
is_local = host == "localhost" or host == "127.0.0.1"

opensearch_client = OpenSearch(
    hosts=[{'host': host, 'port': port}],
    http_auth=auth,
    use_ssl=not is_local,
    verify_certs=not is_local,
    ssl_show_warn=False
)

INDEX_NAME = "candidates"

def init_opensearch():
    if not opensearch_client.indices.exists(index=INDEX_NAME):
        index_body = {
            "settings": {
                "index": {
                    "number_of_shards": 1,
                    "number_of_replicas": 0
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "integer"},
                    "full_name": {"type": "text"},
                    "email": {"type": "keyword"},
                    "phone": {"type": "keyword"},
                    "skills": {"type": "text"},
                    "education": {"type": "text"},
                    "company": {"type": "text"},
                    "location": {"type": "text"},
                    "experience": {"type": "integer"},
                    "status": {"type": "keyword"},
                    "resume_text": {"type": "text"}
                }
            }
        }
        opensearch_client.indices.create(index=INDEX_NAME, body=index_body)

def index_candidate_to_opensearch(candidate: Candidate):
    try:
        init_opensearch()
        
        document = {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "skills": candidate.skills,
            "education": candidate.education,
            "company": candidate.company,
            "location": candidate.location,
            "experience": candidate.experience,
            "status": candidate.status,
            "resume_text": candidate.resume_text
        }
        
        opensearch_client.index(
            index=INDEX_NAME,
            body=document,
            id=candidate.id,
            refresh=True
        )
        print(f"Successfully indexed candidate {candidate.id} to OpenSearch.")
    except Exception as e:
        print(f"Warning: Failed to index to OpenSearch (is it running?): {e}")

def remove_candidate_from_opensearch(candidate_id: int):
    try:
        opensearch_client.delete(index=INDEX_NAME, id=candidate_id)
        print(f"Successfully removed candidate {candidate_id} from OpenSearch.")
    except NotFoundError:
        pass
    except Exception as e:
        print(f"Warning: Failed to delete from OpenSearch (is it running?): {e}")
