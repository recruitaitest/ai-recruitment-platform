from typing import Optional
from datetime import date

from pydantic import BaseModel


class OfferCreate(BaseModel):

    candidate_id: int

    position_id: int

    pipeline_id: int

    salary: str

    employment_type: str

    joining_date: date

    offer_expiry: date

    status: str = "Draft"

    offer_letter: Optional[str] = None

    notes: Optional[str] = None

    created_by: Optional[int] = None


class OfferUpdate(BaseModel):

    salary: Optional[str] = None

    employment_type: Optional[str] = None

    joining_date: Optional[date] = None

    offer_expiry: Optional[date] = None

    status: Optional[str] = None

    offer_letter: Optional[str] = None

    notes: Optional[str] = None


class OfferResponse(BaseModel):

    id: int

    candidate_id: int
    candidate_name: Optional[str] = None

    position_id: int
    position_title: Optional[str] = None

    pipeline_id: int

    salary: str

    employment_type: str

    joining_date: date

    offer_expiry: date

    status: str

    offer_letter: Optional[str]

    notes: Optional[str]

    created_by: Optional[int]

    class Config:
        from_attributes = True