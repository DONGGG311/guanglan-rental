"""Pydantic schemas for user and admin authentication."""

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    name: str
    phone: str
    email: str | None = None
    password: str
    company: str | None = None


class UserLogin(BaseModel):
    phone: str
    password: str


class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None
    company: str | None

    model_config = {"from_attributes": True}
