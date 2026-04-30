from datetime import datetime
from beanie import Document
from pydantic import Field
from typing import Optional
from pymongo import IndexModel, ASCENDING

class OTP(Document):
    identifier: str # email or phone_number
    code: str
    expires_at: datetime
    purpose: str # 'login', 'signup', 'reset_password'
    verified: bool = False

    class Settings:
        name = "otps"
        indexes = [
            "identifier",
            IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0)
        ]
