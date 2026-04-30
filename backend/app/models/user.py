from typing import Optional, List
from beanie import Document, Indexed
from pydantic import EmailStr, Field, BaseModel
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "admin"
    SELLER = "seller"
    CUSTOMER = "customer"

class UserAddress(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    label: str = "Home" # Home, Office, etc.
    name: str
    street: str
    city: str
    state: str
    country: str
    pincode: str
    phone: str
    is_default: bool = False

class User(Document):
    email: Optional[Indexed(EmailStr, unique=True)] = None
    phone_number: Optional[Indexed(str, unique=True)] = None
    hashed_password: Optional[str] = None
    full_name: str
    role: UserRole = UserRole.CUSTOMER
    addresses: List[UserAddress] = []
    is_active: bool = True
    google_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
