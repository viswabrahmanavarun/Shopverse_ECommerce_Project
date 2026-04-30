from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.order import Address, OrderItem

class OrderCreate(BaseModel):
    items: List[OrderItem]
    total_amount: float
    shipping_address: Address
    payment_method: Optional[str] = "online"  # online | cod
    discount_amount: float = 0
    coupon_code: Optional[str] = None

class OrderUpdate(BaseModel):
    payment_status: Optional[str] = None
    payment_id: Optional[str] = None
    order_status: Optional[str] = None

class StatusUpdateOut(BaseModel):
    status: str
    timestamp: datetime
    message: Optional[str] = None

class OrderOut(BaseModel):
    id: str
    user_id: str
    items: List[OrderItem]
    total_amount: float
    shipping_address: Address
    payment_status: str
    payment_id: Optional[str]
    order_status: str
    discount_amount: float = 0
    coupon_code: Optional[str] = None
    status_history: List[StatusUpdateOut] = []
    created_at: datetime

    class Config:
        from_attributes = True
