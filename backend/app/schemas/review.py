from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=3, max_length=100)
    body: str = Field(..., min_length=10, max_length=1000)


class ReviewOut(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    title: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True
