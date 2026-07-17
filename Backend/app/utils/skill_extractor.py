SKILLS_DB = [

    "python",
    "java",
    "c++",
    "javascript",
    "typescript",

    "react",
    "nextjs",
    "nodejs",
    "fastapi",
    "django",

    "sql",
    "postgresql",
    "mongodb",

    "machine learning",
    "ai",
    "data science",

    "docker",
    "kubernetes",
    "aws"
]


def extract_skills(resume_text: str):

    extracted_skills = []

    resume_text = resume_text.lower()

    for skill in SKILLS_DB:

        if skill.lower() in resume_text:

            extracted_skills.append(skill)

    return extracted_skills