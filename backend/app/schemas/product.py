from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from beanie import PydanticObjectId

class ProductVariantBase(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    ram: Optional[str] = None
    rom: Optional[str] = None
    processor: Optional[str] = None
    price: float
    stock: int = 0
    sku: str

class ProductBase(BaseModel):
    name: str
    brand: str = "Generic"
    description: str
    price: float
    category: str
    images: List[str] = []
    variants: List[ProductVariantBase] = []
    stock: int = 0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    variants: Optional[List[ProductVariantBase]] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None

class ProductInDBBase(ProductBase):
    id: PydanticObjectId = Field(alias="_id")
    seller_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class ProductOut(ProductInDBBase):
    @classmethod
    def from_beanie(cls, document):
        return cls(**document.dict())
