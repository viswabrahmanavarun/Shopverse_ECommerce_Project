from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document, Indexed

class Coupon(Document):
    code: str = Indexed(unique=True)
    discount_type: str  # percentage or fixed
    discount_value: float
    min_purchase_amount: float = 0
    max_discount_amount: Optional[float] = None
    expiry_date: datetime
    is_active: bool = True
    usage_limit: Optional[int] = None
    used_count: int = 0
    product_id: Optional[str] = None  # New field: if set, coupon only applies to this product
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "coupons"
