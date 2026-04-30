from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document


class Review(Document):
    product_id: str
    user_id: str
    user_name: str
    rating: int          # 1-5
    title: str
    body: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reviews"
