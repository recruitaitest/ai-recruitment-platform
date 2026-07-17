from pydantic import BaseModel

class LoginSchema(BaseModel):
    email: str
    password: str


class MFAVerifySchema(BaseModel):
    mfa_token: str
    code: str

class VerifyEmailSchema(BaseModel):
    token: str
    
class ForgotPasswordSchema(BaseModel):
    email: str


class ResetPasswordSchema(BaseModel):
    token: str
    password: str
    
class ResendVerificationSchema(BaseModel):
    email: str