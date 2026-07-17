import hashlib
import re

def generate_resume_hash(text: str) -> str:
    # Normalize text by removing all whitespaces and lowercasing
    normalized_text = re.sub(r'\s+', '', text.lower())
    return hashlib.md5(normalized_text.encode('utf-8')).hexdigest()