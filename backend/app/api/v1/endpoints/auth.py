from datetime import timedelta
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.core.config import settings
from app.schemas.user import UserCreate, UserOut, Token, LoginWithOTP
from app.models.user import User
from app.api import deps

from pydantic import BaseModel, EmailStr
from google.oauth2 import id_token
from google.auth.transport import requests
import random
import string
from datetime import datetime, timedelta
from app.models.otp import OTP
from app.utils.email import send_otp_email
from app.utils.sms import send_otp_sms

class SendOTPRequest(BaseModel):
    identifier: str # email or phone
    purpose: str # 'login' or 'signup'
    password: Optional[str] = None

class VerifyOTPRequest(BaseModel):
    identifier: str
    code: str
    purpose: str

router = APIRouter()

class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/send-otp")
async def send_otp(data: SendOTPRequest):
    # Check if user exists for login
    if data.purpose == "login":
        if not data.password:
            raise HTTPException(status_code=400, detail="Password required for login verification")
        
        # Find by email or phone
        user = await User.find_one({
            "$or": [
                {"email": data.identifier},
                {"phone_number": data.identifier}
            ]
        })
        
        if not user or not security.verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect credentials")
    
    # Generate 6-digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Save to DB
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(identifier=data.identifier, code=otp_code, expires_at=expires_at, purpose=data.purpose)
    await otp.insert()
    
    # Determine if it's email or phone (simple check: if it contains '@', it's email)
    if "@" in data.identifier:
        success = send_otp_email(data.identifier, otp_code)
    else:
        success = send_otp_sms(data.identifier, otp_code)
        
    return {"message": "OTP sent successfully", "identifier": data.identifier}

@router.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest):
    otp = await OTP.find_one(
        OTP.identifier == data.identifier, 
        OTP.code == data.code, 
        OTP.purpose == data.purpose,
        OTP.verified == False
    )
    
    if not otp or otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    otp.verified = True
    await otp.save()
    
    return {"message": "OTP verified successfully"}

@router.post("/google", response_model=Token)
async def google_login(data: GoogleLoginRequest) -> Any:
    try:
        # Verify the Google token
        # Note: In production, settings.GOOGLE_CLIENT_ID must be set in .env
        idinfo = id_token.verify_oauth2_token(
            data.token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        email = idinfo['email']
        full_name = idinfo.get('name', '')
        google_id = idinfo['sub']

        # Check if user exists
        user = await User.find_one(User.email == email)
        
        if not user:
            # Create new user if they don't exist
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=security.get_password_hash(security.generate_random_password()), # Random pass for OAuth users
                role="customer",
                google_id=google_id,
                is_active=True
            )
            await user.insert()
        elif not user.google_id:
            # Link Google ID to existing email account if not linked
            user.google_id = google_id
            await user.save()

        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return {
            "access_token": security.create_access_token(
                user.id, expires_delta=access_token_expires
            ),
            "token_type": "bearer",
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )

@router.post("/login", response_model=Token)
async def login(data: LoginWithOTP) -> Any:
    # Find by email or phone
    user = await User.find_one({
        "$or": [
            {"email": data.identifier},
            {"phone_number": data.identifier}
        ]
    })
    
    if not user or not security.verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Verify OTP
    otp = await OTP.find_one(
        OTP.identifier == data.identifier, 
        OTP.code == data.otp_code, 
        OTP.purpose == "login",
        OTP.verified == True
    )
    if not otp:
        raise HTTPException(status_code=400, detail="OTP not verified or invalid")
    
    await otp.delete()
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserOut)
async def read_users_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return {**current_user.dict(), "id": str(current_user.id)}

@router.post("/signup", response_model=UserOut)
async def signup(user_in: UserCreate) -> Any:
    identifier = user_in.email or user_in.phone_number
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or Phone Number is required")

    # Check existence
    or_filters = []
    if user_in.email:
        or_filters.append({"email": user_in.email})
    if user_in.phone_number:
        or_filters.append({"phone_number": user_in.phone_number})
    
    if or_filters:
        existing_user = await User.find_one({"$or": or_filters})
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User already exists with this email or phone.",
            )
    
    # Verify OTP
    otp = await OTP.find_one(
        OTP.identifier == identifier, 
        OTP.code == user_in.otp_code, 
        OTP.purpose == "signup",
        OTP.verified == True
    )
    if not otp:
        raise HTTPException(status_code=400, detail="OTP not verified or invalid")
    
    await otp.delete()

    new_user = User(
        email=user_in.email,
        phone_number=user_in.phone_number,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=True
    )
    await new_user.insert()
    
    return {**new_user.dict(), "id": str(new_user.id)}

@router.post("/reset-password")
async def reset_password(data: LoginWithOTP) -> Any:
    # Verify OTP
    otp = await OTP.find_one(
        OTP.identifier == data.identifier, 
        OTP.code == data.otp_code, 
        OTP.purpose == "reset_password",
        OTP.verified == True
    )
    if not otp:
        raise HTTPException(status_code=400, detail="OTP not verified or invalid")
    
    # Find user
    user = await User.find_one({
        "$or": [
            {"email": data.identifier},
            {"phone_number": data.identifier}
        ]
    })
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.hashed_password = security.get_password_hash(data.password)
    await user.save()
    await otp.delete()
    
    return {"message": "Password reset successfully"}
