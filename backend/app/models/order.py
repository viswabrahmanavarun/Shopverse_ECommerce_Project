from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import Document, Indexed

class Address(BaseModel):
    name: Optional[str] = None
    street: str
    city: str
    state: str
    country: str
    pincode: str
    phone: str

class OrderItem(BaseModel):
    product_id: Optional[str] = None
    name: str
    price: float
    quantity: int
    image: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message: Optional[str] = None

class Order(Document):
    user_id: str
    items: List[OrderItem]
    total_amount: float
    shipping_address: Address
    payment_status: str = "pending" # pending, paid, failed
    payment_id: Optional[str] = None
    order_status: str = "processing" # processing, shipped, delivered, cancelled
    discount_amount: float = 0
    coupon_code: Optional[str] = None
    status_history: List[StatusUpdate] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"
