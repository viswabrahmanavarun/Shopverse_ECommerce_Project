from typing import List, Optional
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime

class ProductVariant(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    ram: Optional[str] = None
    rom: Optional[str] = None
    processor: Optional[str] = None
    price: float
    stock: int = 0
    sku: str

class Product(Document):
    name: Indexed(str)
    brand: Indexed(str) = "Generic"
    description: str
    price: float
    category: Indexed(str)
    images: List[str] = []
    variants: List[ProductVariant] = []
    stock: int = 0
    seller_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"
        indexes = [
            [("name", "text"), ("description", "text"), ("brand", "text")]
        ]
