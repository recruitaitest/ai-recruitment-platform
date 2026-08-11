from sqlalchemy import Column, Integer, String, Text, Boolean

from app.database import Base


class Position(Base):

    __tablename__ = "positions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(String)

    company = Column(String)

    location = Column(String)

    description = Column(Text)

    required_skills = Column(String)

    is_published = Column(Boolean, default=False, nullable=True)