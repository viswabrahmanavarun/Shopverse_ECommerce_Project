from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserAddressBase(BaseModel):
    label: str = "Home"
    name: str
    street: str
    city: str
    state: str
    country: str
    pincode: str
    phone: str
    is_default: bool = False

class UserAddressCreate(UserAddressBase):
    pass

class UserAddressOut(UserAddressBase):
    id: str

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    full_name: str
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str
    otp_code: str

class LoginWithOTP(BaseModel):
    identifier: str # email or phone
    password: str
    otp_code: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: str

class UserOut(UserInDBBase):
    addresses: List[UserAddressOut] = []

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
