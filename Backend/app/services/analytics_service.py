from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
from app.models.candidate import Candidate
from app.models.position import Position
from app.models.interview import Interview
from app.models.pipeline import Pipeline
import datetime

class AnalyticsService:

    @staticmethod
    def dashboard_analytics(db: Session):
        total_candidates = db.query(Candidate).count()
        total_positions = db.query(Position).count()
        total_interviews = db.query(Interview).count()
        total_pipeline_records = db.query(Pipeline).count()

        return {
            "total_candidates": total_candidates,
            "total_positions": total_positions,
            "total_interviews": total_interviews,
            "total_pipeline_records": total_pipeline_records
        }

    @staticmethod
    def pipeline_statistics(db: Session):
        # SELECT stage, COUNT(id) FROM pipelines GROUP BY stage
        results = db.query(Pipeline.stage, func.count(Pipeline.id)).group_by(Pipeline.stage).all()
        return {stage: count for stage, count in results if stage}

    @staticmethod
    def top_skills(db: Session):
        # We must pull candidates and count in memory since skills are stored as a CSV string
        candidates = db.query(Candidate.skills).filter(Candidate.skills != None, Candidate.skills != "").all()
        skill_count = {}
        for (skills_str,) in candidates:
            skills = skills_str.split(",")
            for skill in skills:
                skill = skill.strip()
                if not skill:
                    continue
                if skill in skill_count:
                    skill_count[skill] += 1
                else:
                    skill_count[skill] = 1

        sorted_skills = dict(
            sorted(skill_count.items(), key=lambda item: item[1], reverse=True)
        )
        return sorted_skills

    @staticmethod
    def interview_statistics(db: Session):
        # SELECT status, COUNT(id) FROM interviews GROUP BY status
        results = db.query(Interview.status, func.count(Interview.id)).group_by(Interview.status).all()
        return {status: count for status, count in results if status}

    @staticmethod
    def candidate_status(db: Session):
        # SELECT status, COUNT(id) FROM candidates GROUP BY status
        results = db.query(Candidate.status, func.count(Candidate.id)).group_by(Candidate.status).all()
        return {status: count for status, count in results if status}

    @staticmethod
    def experience_distribution(db: Session):
        # We can use SQL CASE WHEN for this, or pull just the experience column to save memory
        results = db.query(Candidate.experience).all()
        stats = {
            "0-2 Years": 0,
            "3-5 Years": 0,
            "6-10 Years": 0,
            "10+ Years": 0
        }
        for (exp,) in results:
            val = exp or 0
            if val <= 2:
                stats["0-2 Years"] += 1
            elif val <= 5:
                stats["3-5 Years"] += 1
            elif val <= 10:
                stats["6-10 Years"] += 1
            else:
                stats["10+ Years"] += 1
        return stats

    @staticmethod
    def location_distribution(db: Session):
        # SELECT location, COUNT(id) FROM candidates GROUP BY location
        results = db.query(Candidate.location, func.count(Candidate.id)).filter(Candidate.location != None, Candidate.location != "").group_by(Candidate.location).all()
        return {location: count for location, count in results if location}

    @staticmethod
    def hiring_trends(db: Session):
        current_year = datetime.datetime.now().year
        # Count candidates created per month in the current year
        results = db.query(
            extract('month', Candidate.created_at).label('month'), 
            func.count(Candidate.id)
        ).filter(
            extract('year', Candidate.created_at) == current_year
        ).group_by(
            extract('month', Candidate.created_at)
        ).all()
        
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        month_counts = {m: 0 for m in months}
        
        for month_idx, count in results:
            if month_idx and 1 <= month_idx <= 12:
                month_counts[months[int(month_idx) - 1]] = count
                
        return [{"month": m, "hires": month_counts[m]} for m in months]

    @staticmethod
    def time_to_hire(db: Session):
        hired_pipelines = db.query(Pipeline).filter(Pipeline.stage == "Hired").all()
        
        role_stats = {}
        
        for pipeline in hired_pipelines:
            candidate = db.query(Candidate).filter(Candidate.id == pipeline.candidate_id).first()
            position = db.query(Position).filter(Position.id == pipeline.position_id).first()
            
            if candidate and position and pipeline.updated_at and candidate.created_at:
                delta = pipeline.updated_at - candidate.created_at
                days = max(0, delta.days)
                    
                role_name = position.title
                if role_name not in role_stats:
                    role_stats[role_name] = {"total_days": 0, "count": 0}
                
                role_stats[role_name]["total_days"] += days
                role_stats[role_name]["count"] += 1
                
        results = []
        for role, stats in role_stats.items():
            avg_days = stats["total_days"] // stats["count"]
            results.append({"role": role, "days": avg_days})
            
        if not results:
            positions = db.query(Position).all()
            for pos in positions:
                results.append({"role": pos.title, "days": 0})
                
        return results
