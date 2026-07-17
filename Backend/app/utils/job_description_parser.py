from app.utils.skill_extractor import (
    extract_skills
)


def extract_skills_from_job_description(
    job_description: str
):

    skills = extract_skills(
        job_description
    )

    return skills