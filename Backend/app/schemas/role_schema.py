from pydantic import BaseModel
from typing import Optional


class RoleCreate(BaseModel):
    name: str
    permissions: str
    description: Optional[str] = None


class RoleUpdate(BaseModel):
    name: str
    permissions: str
    description: Optional[str] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: str
    description: Optional[str] = None

    class Config:
        from_attributes = True