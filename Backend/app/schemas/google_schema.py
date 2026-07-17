from pydantic import BaseModel


class GoogleLoginSchema(BaseModel):
    credential: str