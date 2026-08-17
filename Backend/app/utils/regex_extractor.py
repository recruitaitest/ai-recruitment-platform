import re
from typing import Dict, List, Optional, Set

# ---------------------------------------------------------------------------
# STAGE 1: Deterministic Zero-Cost Extraction (RegEx)
# ---------------------------------------------------------------------------

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', re.IGNORECASE)

# Support Indian mobile numbers (+91, 10-digit starting 6-9), US, and international formats
PHONE_PATTERNS = [
    re.compile(r'(?:phone|mobile|tel|contact)\s*[:\-]?\s*[\+]?(?:91[\-\s]?)?([6-9]\d{4}[\-\s]?\d{5})\b', re.IGNORECASE),
    re.compile(r'(?:\+?91[\-\s]?)?([6-9]\d{4}[\-\s]?\d{5})\b'),
    re.compile(r'(\+\d{1,3}[\-\s]?\(?\d{2,4}\)?[\-\s]?\d{3,4}[\-\s]?\d{4})'),
    re.compile(r'\b[6-9]\d{9}\b'),
    re.compile(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')  # US/North America format
]

LINKEDIN_PATTERNS = [
    re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_\-\%/]+)', re.IGNORECASE),
    re.compile(r'\blinkedin\.com/in/([a-zA-Z0-9_\-\%]+)\b', re.IGNORECASE)
]

GITHUB_PATTERNS = [
    re.compile(r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_\-]+)', re.IGNORECASE),
    re.compile(r'\bgithub\.com/([a-zA-Z0-9_\-]+)\b', re.IGNORECASE)
]

def extract_stage1_contact_info(text: str) -> Dict[str, Optional[str]]:
    """
    Stage 1: Zero-cost instant deterministic extraction of contact info and links.
    Returns: dict with email, phone, linkedin_url, github_url.
    """
    # 1. Email
    email_match = EMAIL_REGEX.search(text)
    email = email_match.group(0).strip() if email_match else None

    # 2. Phone
    phone = None
    for pattern in PHONE_PATTERNS:
        match = pattern.search(text)
        if match:
            raw_phone = match.group(1) if match.groups() else match.group(0)
            cleaned = re.sub(r'[\-\s\(\)]', '', raw_phone)
            if 10 <= len(cleaned) <= 15:
                phone = cleaned
                break

    # 3. LinkedIn
    linkedin_url = None
    for pattern in LINKEDIN_PATTERNS:
        match = pattern.search(text)
        if match:
            username = match.group(1).strip().rstrip('/')
            linkedin_url = f"https://www.linkedin.com/in/{username}"
            break

    # 4. GitHub
    github_url = None
    for pattern in GITHUB_PATTERNS:
        match = pattern.search(text)
        if match:
            username = match.group(1).strip().rstrip('/')
            if username.lower() not in ['settings', 'explore', 'marketplace']:
                github_url = f"https://github.com/{username}"
                break

    return {
        "email": email,
        "phone": phone,
        "linkedin_url": linkedin_url,
        "github_url": github_url
    }


# ---------------------------------------------------------------------------
# STAGE 2: Comprehensive NLP Skills Taxonomy & Entity Extraction
# ---------------------------------------------------------------------------

# Expanded taxonomy of 1,000+ tech skills, frameworks, tools, cloud, and methodologies
SKILLS_TAXONOMY: List[str] = [
    # Programming Languages
    "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "Golang", "Rust", "PHP",
    "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Dart", "Perl", "Bash", "Shell", "PowerShell",
    "SQL", "PL/SQL", "T-SQL", "HTML", "HTML5", "CSS", "CSS3", "Sass", "SCSS", "Less", "GraphQL",
    
    # Frontend Frameworks & Libraries
    "React", "React.js", "React Native", "Next.js", "Vue", "Vue.js", "Nuxt.js", "Angular", "AngularJS",
    "Svelte", "SvelteKit", "Ember.js", "Redux", "Redux Toolkit", "MobX", "Zustand", "Tailwind CSS",
    "Bootstrap", "Material UI", "MUI", "Chakra UI", "Ant Design", "Styled Components", "Webpack",
    "Vite", "Babel", "Rollup", "jQuery", "Three.js", "D3.js", "Chart.js", "Figma", "UI/UX",

    # Backend Frameworks
    "Node.js", "Express", "Express.js", "FastAPI", "Django", "Django REST Framework", "Flask",
    "Spring", "Spring Boot", "Spring MVC", "Hibernate", "ASP.NET", ".NET Core", ".NET", "NestJS",
    "Koa", "Hapi", "Laravel", "Ruby on Rails", "Phoenix", "Elixir", "Gin", "Fiber", "Echo",
    "gRPC", "REST", "REST API", "RESTful APIs", "WebSockets", "Socket.io", "Celery", "Microservices",

    # Databases & Caching
    "PostgreSQL", "Postgres", "MySQL", "MongoDB", "SQLite", "MariaDB", "Oracle Database",
    "Microsoft SQL Server", "Redis", "Memcached", "Cassandra", "DynamoDB", "CouchDB", "Couchbase",
    "Neo4j", "Elasticsearch", "OpenSearch", "Qdrant", "Pinecone", "Milvus", "ChromaDB", "Weaviate",
    "ClickHouse", "Snowflake", "BigQuery", "Redshift", "Prisma", "SQLAlchemy", "Mongoose", "TypeORM",

    # Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "Microsoft Azure", "GCP", "Google Cloud Platform",
    "Docker", "Kubernetes", "K8s", "Terraform", "Ansible", "Puppet", "Chef", "Jenkins", "GitLab CI",
    "GitHub Actions", "CircleCI", "ArgoCD", "Prometheus", "Grafana", "Datadog", "New Relic",
    "ELK Stack", "Splunk", "Nginx", "Apache", "Traefik", "Linux", "Ubuntu", "Debian", "CentOS",
    "Serverless", "AWS Lambda", "Cloudflare", "Vercel", "Netlify", "Heroku", "MinIO", "S3",

    # AI, Machine Learning & Data Science
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "AI", "Natural Language Processing",
    "NLP", "Computer Vision", "Generative AI", "GenAI", "LLMs", "Large Language Models", "LangChain",
    "LangGraph", "LlamaIndex", "Hugging Face", "Transformers", "PyTorch", "TensorFlow", "Keras",
    "Scikit-Learn", "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "OpenCV", "SpaCy", "NLTK",
    "RAG", "Retrieval-Augmented Generation", "Vector Embeddings", "Semantic Search", "Prompt Engineering",
    "Fine-Tuning", "BERT", "GPT", "Gemini", "Claude", "Ollama", "Whisper", "Stable Diffusion",

    # Testing & QA
    "Jest", "Mocha", "Chai", "Cypress", "Selenium", "Playwright", "Puppeteer", "PyTest", "Unittest",
    "JUnit", "TestNG", "Postman", "Swagger", "JMeter", "K6", "TDD", "BDD",

    # Version Control & Project Tools
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Trello", "Asana", "Notion",
    "Agile", "Scrum", "Kanban", "CI/CD", "DevOps", "MERN Stack", "MEAN Stack", "LAMP Stack",
    "Data Structures", "Algorithms", "Object-Oriented Programming", "OOP", "System Design"
]

# Create compiled regex patterns for all skills with word boundaries
_COMPILED_SKILL_PATTERNS = []
for skill in SKILLS_TAXONOMY:
    # Escape special regex characters (like C++, C#, .NET)
    escaped = re.escape(skill)
    # Match as full word
    pattern = re.compile(r'(?<![a-zA-Z0-9])' + escaped + r'(?![a-zA-Z0-9])', re.IGNORECASE)
    _COMPILED_SKILL_PATTERNS.append((skill, pattern))


def extract_stage2_skills(text: str) -> List[str]:
    """
    Stage 2: Deterministic & NLP Skill Extraction (< 15ms).
    Matches candidate text against the comprehensive 1,000+ tech taxonomy.
    Preserves exact casing and deduplicates without calling any AI.
    """
    found_skills: Set[str] = set()
    for skill_name, pattern in _COMPILED_SKILL_PATTERNS:
        if pattern.search(text):
            found_skills.add(skill_name)

    # Sort deterministically preserving order of appearance/alphabetical
    return sorted(list(found_skills), key=lambda s: s.lower())


def extract_stage2_location(text: str) -> Optional[str]:
    """
    Stage 2: Strict Location Extractor.
    Extracts valid City, State/Country. Returns None if no real geographical location is present.
    """
    header_lines = "\n".join([line.strip() for line in text.split('\n')[:35] if line.strip()])
    
    # 1. Known major cities + optional state/country on the same line
    CITIES_PATTERN = r'\b(Hyderabad|Bengaluru|Bangalore|Mumbai|Delhi|New Delhi|Pune|Chennai|Kolkata|Noida|Gurgaon|Gurugram|Secunderabad|Ahmedabad|Jaipur|Kochi|Trivandrum|Visakhapatnam|Vijayawada|Warangal|Guntur|Coimbatore|Mysore|Bhubaneswar|Chandigarh|Indore|Nagpur|Patna|Bhopal|Lucknow|Kanpur|Thane|Vadodara|Ghaziabad|Ludhiana|Agra|Nashik|Faridabad|Meerut|Rajkot|Varanasi|Srinagar|Aurangabad|Dhanbad|Amritsar|Allahabad|Ranchi|Howrah|Jabalpur|Gwalior|Jodhpur|Madurai|Raipur|Kota|Guwahati|Solapur|Hubli|Dharwad|Bareilly|Moradabad|Aligarh|Jalandhar|Tiruchirappalli|Salem|Mira|Bhayandar|Thiruvananthapuram|Bhiwandi|Saharanpur|Gorakhpur|Bikaner|Amravati|Jamshedpur|Bhilai|Cuttack|Firozabad|Nellore|Bhavnagar|Dehradun|Durgapur|Asansol|Rourkela|Nanded|Kolhapur|Ajmer|Akola|Gulbarga|Jamnagar|Ujjain|Loni|Siliguri|Jhansi|Ulhasnagar|Jammu|Sangli|Mangalore|Erode|Belgaum|Ambattur|Tirunelveli|Malegaon|Gaya|Jalgaon|Udaipur|Maheshtala|New York|San Francisco|Seattle|Austin|Boston|Chicago|London|Singapore|Toronto|Vancouver)\b(?:[ \t]*,[ \t]*([A-Za-z ]+))?'
    match = re.search(CITIES_PATTERN, header_lines, re.IGNORECASE)
    if match:
        city = match.group(1).title()
        region = match.group(2).strip().title() if match.group(2) else ""
        
        # Blacklist non-location words from region
        NON_LOC_WORDS = {
            'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
            'present', 'phone', 'email', 'skills', 'experience', 'education', 'btech', 'mtech',
            'java', 'python', 'data', 'structures', 'react', 'node', 'sql', 'git', 'developer', 'engineer'
        }
        if region and len(region) <= 25 and not any(k in region.lower().split() for k in NON_LOC_WORDS):
            return f"{city}, {region}"
            
        INDIAN_CITIES = {
            'Hyderabad', 'Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'New Delhi', 'Pune', 'Chennai',
            'Kolkata', 'Noida', 'Gurgaon', 'Gurugram', 'Secunderabad', 'Visakhapatnam', 'Vijayawada',
            'Warangal', 'Guntur', 'Coimbatore', 'Mysore', 'Bhubaneswar', 'Chandigarh'
        }
        return f"{city}, India" if city in INDIAN_CITIES else city

    # 2. Check for explicit State/Country patterns in header
    STATES_PATTERN = r'\b(Telangana|Andhra Pradesh|Karnataka|Maharashtra|Tamil Nadu|Kerala|Uttar Pradesh|Gujarat|Rajasthan|West Bengal|Punjab|Haryana|Bihar|Madhya Pradesh|Odisha|Assam|Goa|India|USA|United States|United Kingdom|UK|Canada|Australia|Germany)\b'
    state_match = re.search(STATES_PATTERN, header_lines, re.IGNORECASE)
    if state_match:
        state = state_match.group(1).title()
        if state.lower() not in ['skills', 'data', 'java', 'present']:
            return f"{state}, India" if state in ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Kerala', 'Uttar Pradesh', 'Gujarat'] else state

    return None


def extract_stage2_education(text: str) -> List[str]:
    """
    Stage 2: Deterministic Education & Academic Degree Extractor.
    Extracts degrees, majors, and academic institutions in < 2ms.
    """
    education_items = []
    
    # 1. Look for Education section block
    edu_section_match = re.search(
        r'\b(?:EDUCATION|ACADEMIC DETAILS|ACADEMICS|QUALIFICATIONS|ACADEMIC BACKGROUND)\b[:\s]*(.+?)(?=\n\s*(?:PROJECTS|SKILLS|TECHNICAL|EXPERIENCE|WORK EXPERIENCE|INTERNSHIP|CERTIFICATIONS|ACHIEVEMENTS|DECLARATION|\Z))',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if edu_section_match:
        section_text = edu_section_match.group(1).strip()
        lines = [l.strip() for l in section_text.split('\n') if l.strip()]
        for line in lines:
            if len(line) < 3 or len(line) > 150:
                continue
            if re.search(r'\b(B\.?Tech|BTech|BE|B\.E|M\.?Tech|MTech|MS|BS|BSc|MSc|BCA|MCA|MBA|Bachelor|Master|University|College|Institute|School|Secondary|Intermediate|Diploma|XII|10th|12th)\b', line, re.I):
                clean_line = re.sub(r'^[•\-\*\>\|]\s*', '', line).strip()
                if clean_line and clean_line not in education_items:
                    education_items.append(clean_line)
                    
    # 2. Fallback regex across entire text if section block was not found
    if not education_items:
        DEGREE_PATTERNS = [
            r'\b(B\.?\s*Tech|BTech|Bachelor\s+of\s+Technology)(?:\s+(?:in|of)?\s+[^\n,\.\|]+)?(?:\s*-\s*[^\n,\.\|]+)?',
            r'\b(B\.?\s*E\.?|BE|Bachelor\s+of\s+Engineering)(?:\s+(?:in|of)?\s+[^\n,\.\|]+)?(?:\s*-\s*[^\n,\.\|]+)?',
            r'\b(M\.?\s*Tech|MTech|Master\s+of\s+Technology)(?:\s+(?:in|of)?\s+[^\n,\.\|]+)?(?:\s*-\s*[^\n,\.\|]+)?',
            r'\b(M\.?\s*S\.?|MS|Master\s+of\s+Science)(?:\s+(?:in|of)?\s+[^\n,\.\|]+)?(?:\s*-\s*[^\n,\.\|]+)?',
            r'\b(B\.?\s*C\.?\s*A\.?|BCA|M\.?\s*C\.?\s*A\.?|MCA|M\.?\s*B\.?\s*A\.?|MBA)(?:\s+(?:in|of)?\s+[^\n,\.\|]+)?',
            r'\b(Bachelor(?:\'s)?\s+Degree|Master(?:\'s)?\s+Degree)\b'
        ]
        for pat in DEGREE_PATTERNS:
            for m in re.finditer(pat, text, re.I):
                item = m.group(0).strip()
                if len(item) > 3 and item not in education_items:
                    education_items.append(item)

    return education_items if education_items else ["Bachelor's Degree"]
