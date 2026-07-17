from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Permission(Base):

    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True)

    name = Column(String, unique=True)

    description = Column(Text)