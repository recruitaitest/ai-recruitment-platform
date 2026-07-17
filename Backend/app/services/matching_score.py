from app.services.llm_scoring import score_candidate_with_llm
from app.services.ai_ranking import get_semantic_score


def calculate_match(candidate, position):

    score = 0

    candidate_skills = set(
        skill.strip().lower()
        for skill in (candidate.skills or "").split(",")
        if skill.strip()
    )

    position_skills = set(
        skill.strip().lower()
        for skill in (position.required_skills or "").split(",")
        if skill.strip()
    )

    # -------------------------
    # AI Score (40)
    # -------------------------

    llm_result = score_candidate_with_llm(candidate, position)
    
    if llm_result.score == 0.0 and ("RESOURCE_EXHAUSTED" in llm_result.reasoning or "failed" in llm_result.reasoning.lower()):
        req_skills = position.required_skills or ""
        repeated_req_skills = " ".join([req_skills] * 3)

        position_text = f"""
        Job Title: {position.title or ""}
        
        Required Technical Skills: {repeated_req_skills}
        
        Job Description: {position.description or ""}
        """

        semantic_similarity = get_semantic_score(
            position_text,
            candidate.id
        )

        ai_score = semantic_similarity * 40
    else:
        ai_score = (llm_result.score / 100.0) * 40
    score += ai_score

    # -------------------------
    # Skill Score (40)
    # -------------------------

    if position_skills:

        matched_skills = (
            candidate_skills.intersection(
                position_skills
            )
        )

        skill_score = (
            len(matched_skills)
            / len(position_skills)
        ) * 40

        score += skill_score

    # -------------------------
    # Experience Score (20)
    # -------------------------

    if candidate.experience:

        experience_score = min(
            candidate.experience * 4,
            20
        )

        score += experience_score

    return {
        "score": round(score, 2),
        "ai_score": round(ai_score, 2),
        "skill_score": round(skill_score if position_skills else 0, 2),
        "experience_score": round(experience_score if candidate.experience else 0, 2),
        "reasoning": llm_result.reasoning
    }